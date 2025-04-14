import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/coudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
    // get user details from frontend [use postman]
    //validation
    //check if user already exists: username, email
    //check images , avatar
    //upload them to cloudinary , avatar validation check
    //create user obj-> create entry in db
    //remove password , refresh tokens from response
    //check if user exist
    //return result

    //--------------------------------------------------//

    //user details
    const { username, email, fullName, password } = req.body;
    console.log("Email: ", email);

    //validation
    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    // Validate username: alphanumeric, 3–20 characters
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        throw new ApiError(
            400,
            "Username must be 3-20 characters and can only contain letters, numbers, and underscores"
        );
    }

    // Validate password strength: min 8 characters, at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new ApiError(
            400,
            "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
        );
    }

    // Validate fullName: only letters and spaces allowed, min 2 characters
    const fullNameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!fullNameRegex.test(fullName)) {
        throw new ApiError(
            400,
            "Full name must contain only letters and spaces, and be at least 2 characters long"
        );
    }

    //check for existing user 
    const existedUser = await User.findOne({
        $or: [{ username: new RegExp(`^${username}$`, "i") }, { email }],
    });
    if (existedUser) {
        throw new ApiError(409,"User with same username or email already exists");
        
    }

    //cloudinary upload
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is a required field");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    

    if(!avatar){
        throw new ApiError(400, "Avatar is a required field");
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong registering the User")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

});

export {registerUser} 