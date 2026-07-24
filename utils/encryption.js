const crypto = require('crypto');

// The encryption key must be 32 bytes (256 bits) for aes-256-gcm
// In production, this MUST be set in .env as ENCRYPTION_SECRET_KEY
const getSecretKey = () => {
    const key = process.env.ENCRYPTION_SECRET_KEY;
    if (!key) {
        console.warn("WARNING: ENCRYPTION_SECRET_KEY is not set in .env. Using a volatile fallback key for development ONLY.");
        return crypto.createHash('sha256').update(String('development_fallback_secret')).digest();
    }
    // Hash the key to ensure it's exactly 32 bytes
    return crypto.createHash('sha256').update(String(key)).digest();
};

const encrypt = (text) => {
    if (!text) return null;
    
    const iv = crypto.randomBytes(12); // 12 bytes is standard for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
        encryptedText: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag
    };
};

const decrypt = (encryptedText, ivHex, authTagHex) => {
    if (!encryptedText || !ivHex || !authTagHex) return null;
    
    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm', 
            getSecretKey(), 
            Buffer.from(ivHex, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error("Decryption failed:", err.message);
        return null;
    }
};

module.exports = {
    encrypt,
    decrypt
};
