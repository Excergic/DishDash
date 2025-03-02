import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcrypt"; // Use bcryptjs instead of bcrypt for simplicity
import jwt from "jsonwebtoken";
import connectDB from "./db"; // Your MongoDB connection
import User from "./models/User"; // User model
import Recipe from "./models/Recipe"; // Recipe model
import { Groq } from "groq-sdk";
import * as dotenv from "dotenv";
import path from "path";

// Try a different approach to load environment variables
dotenv.config();
// Also try loading from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });
// And from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('Current directory:', __dirname);
console.log('Env file path:', path.join(__dirname, '.env'));
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('GROQ_API_KEY value:', process.env.GROQ_API_KEY);

// Constants
const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
console.log("Hardcoded GROQ_API_KEY:", GROQ_API_KEY);

// Initialize Groq client with hardcoded key
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173", // Your front-end URL
  methods: ["GET", "POST"],
}));

// Connect to MongoDB
connectDB();

// Signup Route
app.post("/api/auth/signup", async (req: Request, res: Response): Promise<any> => {
  const { email, password, username } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already in use" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ email, password: hashedPassword, username });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    return res.status(201).json({ token, userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
});

// Signin Route
app.post("/api/auth/signin", async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token, userId: user._id });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
});

// Define Response Type for Groq
interface AIRecipeResponse {
  title: string;
  instructions: string;
}

// Generate Recipe Route
app.post("/api/v1/recipes/generate", async (req: Request, res: Response): Promise<any> => {
  const { ingredients } = req.body;
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Check token
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });
  if (!GROQ_API_KEY) return res.status(500).json({ message: "Groq API key not configured" });

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Validate ingredients
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ message: "Ingredients must be a non-empty array" });
    }

    // Prompt for Groq
    const prompt = `Generate a detailed Indian recipe using these ingredients: ${ingredients.join(", ")}. Include cooking times, serving size for 2 people, and clear step-by-step instructions. Return only JSON with format: {"title": "Recipe Name", "instructions": "Step 1. Do this. Step 2. Do that. ..."}`;

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }, // Ensure JSON output
    });

    // Parse Groq response
    const responseText = chatCompletion.choices[0]?.message?.content?.trim() ?? '';
    let aiResponse: AIRecipeResponse;
    try {
      aiResponse = JSON.parse(responseText);
      if (!aiResponse.title || !aiResponse.instructions) throw new Error("Incomplete recipe");
    } catch (error) {
      console.error("Parse error:", error);
      aiResponse = {
        title: "Simple Indian Dish",
        instructions: `Combine ${ingredients.join(", ")} with spices, cook for 20 minutes, and serve hot. Serves 2.`,
      };
    }

    // Save to MongoDB
    const recipe = new Recipe({
      ingredients,
      generatedRecipe: aiResponse,
      userId,
    });
    await recipe.save();

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
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
});

// Extend Request type to include userId
declare module 'express' {
  interface Request {
    userId?: string;
  }
}


// Middleware to verify JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Endpoint to get user's past recipes
app.get('/api/recipes', verifyToken, async (req: Request, res: Response) : Promise<any> => {
  try {
    const recipes = await Recipe.find({ userId: req.userId });
    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ message: 'No past recipes found' });
    }
    res.status(200).json({ message: 'Recipes retrieved successfully', recipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));