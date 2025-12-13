
import express from 'express';
import { prismaClient } from 'mpc-db/client';
import { PublicKey, TSSCli } from 'solana-mpc-tss-lib/mpc';
import sodium from 'libsodium-wrappers';

/**
 * Main application entry point for the MPC backend server.
 * Handles user key generation and multi-party signing for Solana transactions.
 */
async function main(): Promise<void> {
  // Initialize libsodium WASM for cryptographic operations
  await sodium.ready;
  console.log('libsodium initialized successfully');

  const cli = new TSSCli();
  const app = express();

  // Middleware
  app.use(express.json());

  // Input validation interfaces
  interface CreateUserRequest {
    userId: string;
  }

  interface SendStep1Request {
    to: string;
    amount: number;
    userId: string;
    recentBlockhash: string;
  }

  interface SendStep2Request {
    to: string;
    amount: number;
    userId: string;
    recentBlockhash: string;
    step1Responses: any; // Define proper type based on TSSCli
    allPublicNonces: any; // Define proper type based on TSSCli
  }

  /**
   * Creates a new user with generated MPC keypair.
   */
  app.post('/create-user', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { userId }: CreateUserRequest = req.body;

      // Basic input validation
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }

      const participant = await cli.generate();

      await prismaClient.keyshare.create({
        data: {
          userid: userId,
          publicKey: participant.publicKey,
          secretKey: participant.secretKey,
        },
      });

      res.json({
        publicKey: participant.publicKey,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Handles the first step of aggregate signing.
   */
  app.post('/send/step1', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { to, amount, userId, recentBlockhash }: SendStep1Request = req.body;

      // Input validation
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      if (!to || typeof to !== 'string') {
        res.status(400).json({ error: 'Invalid recipient address' });
        return;
      }
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
      }
      if (!recentBlockhash || typeof recentBlockhash !== 'string') {
        res.status(400).json({ error: 'Invalid recentBlockhash' });
        return;
      }

      const user = await prismaClient.keyshare.findFirst({
        where: { userid: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const response = await cli.aggregateSignStepOne(
        user.secretKey,
        to,
        amount,
        undefined, // Optional memo
        recentBlockhash,
      );

      res.json({ response });
    } catch (error) {
      console.error('Error in step1:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * Handles the second step of aggregate signing.
   */
  app.post('/send/step2', async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { to, amount, userId, recentBlockhash, step1Responses, allPublicNonces }: SendStep2Request = req.body;

      // Input validation
      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'Invalid userId' });
        return;
      }
      if (!to || typeof to !== 'string') {
        res.status(400).json({ error: 'Invalid recipient address' });
        return;
      }
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ error: 'Invalid amount' });
        return;
      }
      if (!recentBlockhash || typeof recentBlockhash !== 'string') {
        res.status(400).json({ error: 'Invalid recentBlockhash' });
        return;
      }
      if (!step1Responses || !allPublicNonces) {
        res.status(400).json({ error: 'Missing signing data' });
        return;
      }

      const user = await prismaClient.keyshare.findFirst({
        where: { userid: userId },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const response = await cli.aggregateSignStepTwo(
        step1Responses,
        user.secretKey,
        to,
        amount,
        allPublicNonces,
        undefined,
        recentBlockhash,
      );

      res.json({
        response,
        publicKey: user.publicKey,
      });
    } catch (error) {
      console.error('Error in step2:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`MPC backend server listening on port ${port}`);
  });
}

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch((error) => {
  console.error('Failed to start MPC backend server:', error);
  process.exit(1);
});