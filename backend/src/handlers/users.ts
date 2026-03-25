import { Router } from "express";
import axios from "axios";
import env from "../environments";

export default function mountUserEndpoints(router: Router) {
  
  // THE SOVEREIGN SIGN-IN (The /me Handshake)
  router.post('/signin', async (req, res) => {
    const { authResult } = req.body;
    const userCollection = req.app.locals.userCollection;

    try {
      // 1. Verify the identity with Pi Network (Source of Truth)
      const response = await axios.get("https://api.minepi.com/v2/me", {
        headers: { Authorization: `Bearer ${authResult.accessToken}` }
      });

      const piUser = response.data;

      // 2. Map to the Sovereign Vault (Upsert)
      // We use 'uid' as the unique key, not the username (usernames can change)
      const updateResult = await userCollection.findOneAndUpdate(
        { uid: piUser.uid },
        { 
          $set: { 
            username: piUser.username,
            roles: piUser.roles,
            last_login: new Date(),
            node_assignment: "Lagos-NG-Main", // Institutional Branding
            probity_status: "Verified"
          },
          $setOnInsert: { 
            created_at: new Date(),
            vault_id: `ASV-${Math.random().toString(36).substr(2, 9).toUpperCase()}` 
          }
        },
        { upsert: true, returnDocument: 'after' }
      );

      // 3. Establish the Sovereign Session
      // @ts-ignore (Assuming you've updated types/session.ts)
      req.session.currentUser = updateResult.value || updateResult;

      return res.status(200).json({ 
        message: "Sovereign Access Granted", 
        user: req.session.currentUser 
      });

    } catch (error) {
      console.error("❌ Signin Handshake Failed:", error);
      return res.status(401).json({ error: "Unauthorized by Novalex Hub" });
    }
  });

  // SIGN-OUT: Clear the session
  router.get('/signout', (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).send("Logout Error");
      res.status(200).json({ message: "Sovereign Session Terminated" });
    });
  });
}
