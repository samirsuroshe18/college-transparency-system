import pkg from "jsonwebtoken";

const { verify } = pkg;
const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized. No token provided." });
    }

    try {
        const decoded = verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.user = decoded; // Attach user data to request
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token." });
    }
};

export { authenticateUser };
