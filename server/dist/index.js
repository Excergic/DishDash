"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt")); // Use bcryptjs instead of bcrypt for simplicity
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db")); // Your MongoDB connection
const User_1 = __importDefault(require("./models/User")); // User model
const Recipe_1 = __importDefault(require("./models/Recipe")); // Recipe model
const groq_sdk_1 = require("groq-sdk");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Try a different approach to load environment variables
dotenv.config();
// Also try loading from parent directory
dotenv.config({ path: path_1.default.join(__dirname, '../../.env') });
// And from server directory
dotenv.config({ path: path_1.default.join(__dirname, '../.env') });
// Debug environment variables
console.log('Environment variables loaded:');
console.log('Current directory:', __dirname);
console.log('Env file path:', path_1.default.join(__dirname, '.env'));
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('GROQ_API_KEY value:', process.env.GROQ_API_KEY);
// Constants
const app = (0, express_1.default)();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
console.log("Hardcoded GROQ_API_KEY:", GROQ_API_KEY);
// Initialize Groq client with hardcoded key
const groq = new groq_sdk_1.Groq({ apiKey: GROQ_API_KEY });
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173", // Your front-end URL
    methods: ["GET", "POST"],
}));
// Connect to MongoDB
(0, db_1.default)();
// Signup Route
app.post("/api/auth/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, username } = req.body;
    try {
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser)
            return res.status(400).json({ message: "Email already in use" });
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const user = new User_1.default({ email, password: hashedPassword, username });
        yield user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        return res.status(201).json({ token, userId: user._id });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}));
// Signin Route
app.post("/api/auth/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "Invalid credentials" });
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
        return res.json({ token, userId: user._id });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
}));
// Generate Recipe Route
app.post("/api/v1/recipes/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const { ingredients } = req.body;
    const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    // Check token
    if (!token)
        return res.status(401).json({ message: "No token, authorization denied" });
    if (!GROQ_API_KEY)
        return res.status(500).json({ message: "Groq API key not configured" });
    try {
        // Verify JWT
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        // Validate ingredients
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ message: "Ingredients must be a non-empty array" });
        }
        // Prompt for Groq
        const prompt = `Generate a detailed Indian recipe using these ingredients: ${ingredients.join(", ")}. Include cooking times, serving size for 2 people, and clear step-by-step instructions. Return only JSON with format: {"title": "Recipe Name", "instructions": "Step 1. Do this. Step 2. Do that. ..."}`;
        // Call Groq API
        const chatCompletion = yield groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }, // Ensure JSON output
        });
        // Parse Groq response
        const responseText = (_e = (_d = (_c = (_b = chatCompletion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : '';
        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
            if (!aiResponse.title || !aiResponse.instructions)
                throw new Error("Incomplete recipe");
        }
        catch (error) {
            console.error("Parse error:", error);
            aiResponse = {
                title: "Simple Indian Dish",
                instructions: `Combine ${ingredients.join(", ")} with spices, cook for 20 minutes, and serve hot. Serves 2.`,
            };
        }
        // Save to MongoDB
        const recipe = new Recipe_1.default({
            ingredients,
            generatedRecipe: aiResponse,
            userId,
        });
        yield recipe.save();
        // Send response
        return res.status(201).json({
            message: "Recipe generated successfully",
            recipe: {
                title: aiResponse.title,
                instructions: aiResponse.instructions,
                ingredients,
                _id: recipe._id,
            },
        });
    }
    catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Server error", error });
    }
}));
// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
// Endpoint to get user's past recipes
app.get('/api/recipes', verifyToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const recipes = yield Recipe_1.default.find({ userId: req.userId });
        if (!recipes || recipes.length === 0) {
            return res.status(404).json({ message: 'No past recipes found' });
        }
        res.status(200).json({ message: 'Recipes retrieved successfully', recipes });
    }
    catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Server error' });
    }
}));
// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
