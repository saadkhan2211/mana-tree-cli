<h1>🌳 Mana-Tree</h1>

Mana-Tree is a full-stack project generator that converts simple text-based project structures into ready-to-use downloadable ZIP archives.

**It includes:**

⚡ Local project generation via CLI

☁️ Cloud-saved projects with account sync

🔐 Secure authentication system

📦 Instant ZIP archive downloads

🧠 Smart project structure parsing

🚀 Installation

    npm install -g mana-tree

<h3>⚙️ Usage</h3>

🛠 Generate Project Locally

    mt create --project server --file structure.txt

Example structure.txt:

    src/
      index.ts
      routes/
        user.ts
    package.json

This generates:

    server.zip

🔐 Login to Your Account

    mt login

You will be prompted for:

- Email
- Password

📂 List Saved Projects
    
    mt list

Displays all active cloud-saved projects linked to your account.

⬇️ Download Saved Project

    mt -d server

Downloads your saved project as:

    server.zip
🚪 Logout

    mt logout

👨‍💻 Author

<h3>Saad Saifullah</h3>

📜 License

<h3>MIT</h3>
