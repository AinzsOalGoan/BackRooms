import dotenv from "dotenv";
import { app } from "./app.js"; // we r using app.js app not directly from express which will create a new instance of express and will make us lose all the made up routes, middleware built in app.js
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
});


connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️  Server is running at port ${process.env.PORT}`);
        });
        app.on("error", (error) => {
            console.log("Server error:", error);
            throw error;
        });
    })
    .catch((err) => {
        console.log("Mongo db connection failed !!!!", err);
    });
