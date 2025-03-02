import mongoose, { Document, Schema } from 'mongoose';

interface IRecipe extends Document{
    ingredients : string[]; // e.g [paneer, butter, salt, masala..]
    generatedRecipe : {
        title : string;
        instruction : string;
    } ;
    
    userId : mongoose.Types.ObjectId;
    createdAt : Date;
    updateAt : Date;
}

const RecipeSchema: Schema = new Schema(
    {
      ingredients: {
        type: [String], // Array of strings
        required: true,
      },
      generatedRecipe: {
        title: { type: String, required: true },
        instructions: { type: String, required: true },
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    },
    {
      timestamps: true,
    }
  );

  export default mongoose.model<IRecipe>('Recipe', RecipeSchema);