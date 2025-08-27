# Oassis - YouTube-Twitter Clone 🎥🐦

A full-stack social media application that combines features inspired by YouTube and Twitter — built using **MERN Stack** and **Next.js** for a fast, modern user experience.

## 🚀 Features

- 🔐 **Authentication**: Secure login/signup using JWT
- 📺 **Video Streaming**: Upload, play, and watch videos
- 🐦 **Tweet-like Feed**: Post short updates with likes and replies
- 💬 **Comments**: Real-time commenting system on videos/posts
- 👤 **Profiles**: View user channels and timelines
- 📱 **Responsive UI**: Fully mobile-friendly and clean interface

## 🛠 Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JSON Web Tokens (JWT)
- **Cloud Storage**: Cloudinary (for videos/images)

## 📁 Folder Structure

<pre>
.
├── YOUTUBE CLONE/
│   ├── frontend/
│   │   ├── .next/
│   │   ├── app/
│   │   ├── lib/
│   │   ├── node_modules/
│   │   ├── public/
│   │   ├── .env
│   │   ├── .gitignore
│   │   ├── eslint.config.mjs
│   │   ├── next-env.d.ts
│   │   ├── next.config.js
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   ├── constants.js
│   │   └── index.js
│   ├── .env
│   ├── .env.sample
│   ├── .gitignore
│   ├── .prettierignore
│   └── .prettierrc
</pre>

## 🧪 How to Run Locally

### Running backend 

```bash

# 1. Fork and Clone the repository
git clone https://github.com/your_username/Youtube-Twitter-clone.git

# 2. Go to the project directory
cd Youtube-Twitter-clone

# 3. Install dependencies
npm install

# 4. Create a .env file and add your environment variables
# Example:
# MONGODB_URI=
# JWT_SECRET=
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=

# 5. Run the development server
npm run dev

model link = https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj
```

### Running Frontend 

```bash

# 1. Go to the frontend project directory
cd frontend

:- Your path should look like this : Youtube-Twitter-clone/frontend

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev

```

