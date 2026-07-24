const jwt = require('jsonwebtoken');

// Secret used specifically for internal container-to-container auth
const getInternalSecret = () => {
    const secret = process.env.INTERNAL_JWT_SECRET;
    if (!secret) {
        console.warn("WARNING: INTERNAL_JWT_SECRET is not set in .env. Using a volatile fallback secret for development ONLY.");
        return 'development_internal_jwt_secret';
    }
    return secret;
};

/**
 * Generate a short-lived token for internal microservice communication
 */
const generateInternalToken = (payload, expiresIn = '5m') => {
    // Default payload includes service identity
    const defaultPayload = {
        iss: 'node-backend',
        service: 'pipecat-worker',
        ...payload
    };
    
    return jwt.sign(defaultPayload, getInternalSecret(), { expiresIn });
};

/**
 * Middleware to verify internal JWT requests
 */
const verifyInternalRequest = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, getInternalSecret());
        
        // Ensure this token was issued for the pipecat worker
        if (decoded.service !== 'pipecat-worker') {
            return res.status(403).json({ error: 'Invalid service identity' });
        }
        
        req.internalToken = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token expired or invalid', details: err.message });
    }
};

module.exports = {
    generateInternalToken,
    verifyInternalRequest
};
