# Auto-Grant MINTER_ROLE Setup

This feature automatically grants MINTER_ROLE to warehouse authorities when they log in for the first time.

## 🔧 Setup Instructions

### 1. Get Your Deployer Private Key

The deployer wallet is the one that deployed the smart contracts. It has ADMIN_ROLE and can grant MINTER_ROLE.

**From Hardhat:**
```bash
cd Blockchain
# If you used a mnemonic:
cat .env | grep MNEMONIC

# If you used a private key:
cat .env | grep PRIVATE_KEY
```

**⚠️ SECURITY WARNING:** Never commit private keys to git! The `.env.local` file is already in `.gitignore`.

### 2. Add Private Key to .env.local

Edit `frontend/.env.local`:
```env
ADMIN_PRIVATE_KEY=0xYourDeployerPrivateKeyHere
```

### 3. Restart Dev Server

```bash
cd frontend
npm run dev
```

## 🎯 How It Works

1. User selects "Warehouse Authority" on login page
2. User connects MetaMask wallet
3. Frontend automatically calls `/api/grant-minter-role`
4. Backend uses admin wallet to grant MINTER_ROLE to user's address
5. User can now issue eNWR tokens without errors!

## 🧪 Testing

1. Clear your browser cache and localStorage
2. Select "Warehouse Authority" role
3. Connect wallet
4. Check browser console - you should see:
   ```
   🔑 Auto-granting MINTER_ROLE for warehouse authority...
   ✅ MINTER_ROLE granted successfully! Tx: 0x...
   ```
5. Fill out crop inspection form and submit
6. eNWR token should be issued successfully!

## 🐛 Troubleshooting

### "Server configuration error: ADMIN_PRIVATE_KEY not set"
- Make sure you added `ADMIN_PRIVATE_KEY` to `frontend/.env.local`
- Restart the dev server after adding it

### "execution reverted"
- Your admin wallet might not have ADMIN_ROLE on RoleRegistry
- Make sure you're using the deployer wallet's private key

### "Already has MINTER_ROLE"
- This is normal! It means the role was already granted before
- The form should work without errors

## 🔒 Production Notes

For production:
- Use environment variables in your hosting platform (Vercel, etc.)
- Consider using AWS Secrets Manager or HashiCorp Vault
- Add rate limiting to prevent abuse
- Add authentication to the API endpoint
- Consider using a dedicated "granter" wallet instead of the deployer wallet
