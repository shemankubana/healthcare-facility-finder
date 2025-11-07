import express from "express";
import { supabase, supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/**
 * Approve a user signup request
 * POST /api/users/approve
 * Body: { requestId: string, adminToken: string }
 */
router.post("/approve", async (req, res) => {
  try {
    const { requestId, adminToken } = req.body;

    if (!requestId || !adminToken) {
      return res.status(400).json({
        error: "Missing required fields: requestId and adminToken"
      });
    }

    // Verify admin token and get admin user
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(adminToken);

    if (authError || !adminUser) {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }

    // Verify user is admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", adminUser.id)
      .single();

    if (profileError || !adminProfile?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Get the signup request
    const { data: request, error: requestError } = await supabase
      .from("signup_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Signup request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: `Request already ${request.status}`
      });
    }

    // Create the user in Supabase Auth using admin API
    if (!supabaseAdmin) {
      return res.status(500).json({
        error: "Admin operations not configured. SUPABASE_SERVICE_ROLE_KEY is required."
      });
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      request.email,
      {
        data: {
          first_name: request.first_name,
          last_name: request.last_name,
          role: request.role,
          is_admin: false
        }
      }
    );

    if (createError) {
      console.error("Error inviting user:", createError);
      return res.status(500).json({
        error: `Failed to invite user: ${createError.message}`
      });
    }

    // Update signup request status
    const { error: updateError } = await supabase
      .from("signup_requests")
      .update({
        status: "approved",
        approved_by: adminUser.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Error updating request:", updateError);
      return res.status(500).json({ error: "Failed to update request status" });
    }

    // Create user profile (if the auth user was created)
    if (authData?.user) {
      const { error: profileCreateError } = await supabase
        .from("user_profiles")
        .insert({
          id: authData.user.id,
          email: request.email,
          first_name: request.first_name,
          last_name: request.last_name,
          role: request.role,
          is_admin: false,
          approval_status: "approved"
        });

      if (profileCreateError) {
        console.error("Error creating user profile:", profileCreateError);
        // Don't fail the request, profile can be created later
      }
    }

    res.json({
      success: true,
      message: "User approved successfully. Invitation email sent.",
      userId: authData?.user?.id
    });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject a user signup request
 * POST /api/users/reject
 * Body: { requestId: string, adminToken: string }
 */
router.post("/reject", async (req, res) => {
  try {
    const { requestId, adminToken } = req.body;

    if (!requestId || !adminToken) {
      return res.status(400).json({
        error: "Missing required fields: requestId and adminToken"
      });
    }

    // Verify admin token and get admin user
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(adminToken);

    if (authError || !adminUser) {
      return res.status(401).json({ error: "Invalid or expired admin token" });
    }

    // Verify user is admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", adminUser.id)
      .single();

    if (profileError || !adminProfile?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Update signup request status
    const { error: updateError } = await supabase
      .from("signup_requests")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString()
      })
      .eq("id", requestId);

    if (updateError) {
      return res.status(500).json({ error: "Failed to update request status" });
    }

    res.json({
      success: true,
      message: "User request rejected successfully"
    });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all signup requests (admin only)
 * GET /api/users/requests
 * Headers: Authorization: Bearer <token>
 */
router.get("/requests", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    // Verify admin token
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !adminUser) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Verify user is admin
    const { data: adminProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("id", adminUser.id)
      .single();

    if (profileError || !adminProfile?.is_admin) {
      return res.status(403).json({ error: "Unauthorized: Admin access required" });
    }

    // Get all signup requests
    const { data: requests, error: requestsError } = await supabase
      .from("signup_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestsError) {
      return res.status(500).json({ error: "Failed to fetch requests" });
    }

    res.json({
      success: true,
      requests: requests || []
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
