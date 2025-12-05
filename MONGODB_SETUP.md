# MongoDB Atlas Setup Guide

This app now uses MongoDB Atlas for secure, persistent user data storage instead of localStorage.

## Prerequisites

1. A MongoDB Atlas account (free tier available at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
2. Node.js and npm installed

## Setup Steps

### 1. Create a MongoDB Atlas Cluster

1. Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project (or use an existing one)
3. Click "Build a Database" → Choose "Free" tier (M0)
4. Select a cloud provider and region (choose one close to you)
5. Name your cluster (e.g., "response-ready-cluster")
6. Click "Create Cluster"

### 2. Create Database User

1. In the Security section, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Enter a username and generate a secure password (save this!)
5. Set user privileges to "Atlas admin" (or create a custom role with read/write access)
6. Click "Add User"

### 3. Configure Network Access

1. In the Security section, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, restrict to specific IPs
4. Click "Confirm"

### 4. Get Connection String

1. In the Database section, click "Connect"
2. Choose "Connect your application"
3. Select "Node.js" as the driver
4. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

### 5. Configure Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add your MongoDB connection string:

   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/response-ready?retryWrites=true&w=majority
   ```

   **Important**: Replace:
   - `username` with your database username
   - `password` with your database password
   - `cluster` with your cluster name
   - Add `/response-ready` before the `?` to specify the database name

3. The `.env.local` file should look like:
   ```env
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://myuser:mypassword@response-ready-cluster.xxxxx.mongodb.net/response-ready?retryWrites=true&w=majority
   
   # Other environment variables...
   NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_id_here
   NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
   ```

### 6. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

## Verification

1. Register a new user in the app
2. Check your MongoDB Atlas dashboard:
   - Go to "Database" → "Browse Collections"
   - You should see a `response-ready` database
   - It should contain `users` and `useractivities` collections
3. Try logging in with the new user account

## Security Notes

- **Never commit `.env.local` to version control** (it's already in `.gitignore`)
- Use strong passwords for your database user
- In production, restrict network access to specific IPs
- Consider using MongoDB's built-in encryption at rest
- Regularly rotate database passwords

## Troubleshooting

### Connection Error: "MONGODB_URI environment variable not defined"
- Make sure `.env.local` exists in the project root
- Verify the variable name is exactly `MONGODB_URI`
- Restart the development server after adding the variable

### Authentication Failed
- Double-check username and password in the connection string
- Ensure the database user has proper permissions
- Verify the password doesn't contain special characters that need URL encoding

### Network Access Denied
- Check that your IP address is whitelisted in MongoDB Atlas
- For development, you can temporarily allow all IPs (0.0.0.0/0)

### Database Not Found
- The database will be created automatically on first use
- Make sure the connection string includes the database name: `/response-ready`

## Migration from localStorage

If you had existing users in localStorage, they will need to register again. The MongoDB migration is a fresh start for user data, which is more secure and reliable.

## Production Deployment

When deploying to production (Heroku, Vercel, etc.):

1. Add `MONGODB_URI` to your hosting platform's environment variables
2. Use the same connection string or create a separate production cluster
3. Restrict network access to your production server IPs
4. Consider using MongoDB Atlas's built-in monitoring and backups

## Support

For MongoDB Atlas issues, refer to:
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://developer.mongodb.com/community/forums/)

