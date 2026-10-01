# Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Student Loan EMI & Prepayment Optimizer** across **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Database).

---

## 1. Database Configuration: MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create or select a Cluster (e.g. Shared M0 Free Tier).
3. **Configure Network Access**:
   - Go to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so Render servers can connect to the database.
4. **Configure Database User**:
   - Go to **Security** → **Database Access**.
   - Create a user with **Read and write to any database** permissions.
5. **Get Connection String**:
   - Go to **Database** → Click **Connect** → Choose **Drivers**.
   - Copy the URI template:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/loan-optimizer?retryWrites=true&w=majority
     ```

---

## 2. Backend Deployment: Render Web Service

1. Commit your codebase to a **GitHub** repository.
2. Log in to [Render](https://render.com/) and click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the build parameters:
   - **Name**: `student-loan-optimizer-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Configure Environment Variables in Render:

   | Key | Example Value | Description |
   | :--- | :--- | :--- |
   | `PORT` | `5000` | Internal server port |
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/loan-optimizer...` | MongoDB Atlas URI |
   | `JWT_SECRET` | `prod_secret_key_987654321` | Secret key for signing JWT tokens |
   | `JWT_EXPIRES_IN` | `7d` | Token validity period |
   | `NODE_ENV` | `production` | Set node environment to production |
   | `CLIENT_URL` | `https://student-loan-optimizer.vercel.app` | Vercel production URL |

6. Click **Create Web Service**. Once deployed, copy your backend URL (e.g., `https://student-loan-optimizer-api.onrender.com`).

---

## 3. Frontend Deployment: Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New...** → **Project**.
2. Select your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure Environment Variables:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://student-loan-optimizer-api.onrender.com/api` | Render backend URL + `/api` |

5. Ensure `client/vercel.json` is present for SPA routing:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
6. Click **Deploy**.

---

## 4. Post-Deployment Verification

1. Open your Vercel URL: `https://student-loan-optimizer.vercel.app`.
2. Check browser console network tab: verify requests to `/api/health` return HTTP 200.
3. Test Registration, Login, Scenario Saving, and PDF Generation in the live environment.
