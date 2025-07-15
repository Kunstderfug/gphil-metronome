# Git Setup Instructions

## Overview
This document provides step-by-step instructions for setting up a remote Git repository and pushing your metronome project to it.

## Prerequisites
- Git installed on your system
- Account on GitHub, GitLab, or Bitbucket
- Your metronome project is already initialized with Git (✅ Already done)

## Step 1: Create Remote Repository

### GitHub
1. Go to [github.com](https://github.com)
2. Click the **"+"** icon → **"New repository"**
3. Fill in repository details:
   - **Repository name**: `metronome`
   - **Description**: "Metronome application with opus file processing"
   - **Visibility**: Choose Public or Private
   - **⚠️ Important**: Do NOT initialize with README, .gitignore, or license
4. Click **"Create repository"**

### GitLab
1. Go to [gitlab.com](https://gitlab.com)
2. Click **"New project"** → **"Create blank project"**
3. Fill in project details:
   - **Project name**: `metronome`
   - **Project description**: "Metronome application with opus file processing"
   - **Visibility Level**: Choose Public or Private
   - **⚠️ Important**: Uncheck "Initialize repository with a README"
4. Click **"Create project"**

### Bitbucket
1. Go to [bitbucket.org](https://bitbucket.org)
2. Click **"Create"** → **"Repository"**
3. Fill in repository details:
   - **Repository name**: `metronome`
   - **Description**: "Metronome application with opus file processing"
   - **Access level**: Choose Public or Private
   - **⚠️ Important**: Keep "Include a README?" set to "No"
4. Click **"Create repository"**

## Step 2: Add Remote Origin

Navigate to your project directory and add the remote:

```bash
cd /path/to/metronome
```

### Option A: HTTPS (Recommended for beginners)
```bash
# Replace with your actual repository URL
git remote add origin https://github.com/yourusername/metronome.git

# Verify the remote was added
git remote -v
```

### Option B: SSH (Requires SSH key setup)
```bash
# Replace with your actual repository URL
git remote add origin git@github.com:yourusername/metronome.git

# Verify the remote was added
git remote -v
```

## Step 3: Push to Remote Repository

### First Push (sets upstream)
```bash
# Push and set upstream branch
git push -u origin main
```

### Future Pushes
```bash
# After making changes and committing
git add .
git commit -m "Your commit message"
git push
```

## Step 4: Verify Setup

1. **Check remote status:**
   ```bash
   git remote -v
   ```

2. **View your repository online:**
   - Go to your repository URL in a web browser
   - Verify all files are present
   - Check that `.gitignore` is working (no `node_modules/` or `.DS_Store`)

## Authentication Methods

### HTTPS Authentication
- **Username**: Your Git platform username
- **Password**: 
  - **GitHub**: Personal Access Token (not your account password)
  - **GitLab**: Personal Access Token or account password
  - **Bitbucket**: App Password or account password

### SSH Authentication
1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   ```

2. **Add SSH key to your Git platform:**
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Add to your account settings under "SSH Keys"

3. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   ```

## Common Issues & Solutions

### Issue: Authentication Failed
**Solution**: 
- For HTTPS: Use Personal Access Token instead of password
- For SSH: Ensure SSH key is added to your account

### Issue: Remote Already Exists
**Solution**:
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin <your-repo-url>
```

### Issue: Push Rejected
**Solution**:
```bash
# Pull any remote changes first
git pull origin main --allow-unrelated-histories

# Then push
git push -u origin main
```

## Git Workflow Best Practices

### Daily Workflow
1. **Check status**: `git status`
2. **Add changes**: `git add .` or `git add <specific-files>`
3. **Commit changes**: `git commit -m "Descriptive message"`
4. **Push changes**: `git push`

### Commit Message Guidelines
- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Start with a verb: "Fix", "Add", "Update", "Remove"

### Examples:
```bash
git commit -m "Add visual feedback for file processing"
git commit -m "Fix folder name generation logic"
git commit -m "Update documentation with new features"
```

## Repository Structure

Your repository should now contain:
```
metronome/
├── .gitignore              # Git ignore rules
├── docs/                   # Documentation
│   ├── git-setup.md
│   └── server-ui-improvements.md
├── server/                 # Server application
│   ├── .gitignore         # Server-specific ignores
│   ├── public/            # Static files
│   ├── views/             # EJS templates
│   └── package.json       # Server dependencies
├── src/                   # Source files
├── package.json           # Main project dependencies
├── README.md              # Project overview
└── ...                    # Other project files
```

## Next Steps

1. **Create repository** on your chosen platform
2. **Replace placeholders** in commands with your actual URLs
3. **Run the commands** in your terminal
4. **Verify everything** works by visiting your repository online
5. **Set up branch protection** rules (optional but recommended)

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify your repository URL is correct
3. Ensure you have proper permissions
4. Try regenerating access tokens if using HTTPS
5. Check SSH key setup if using SSH

Happy coding! 🚀