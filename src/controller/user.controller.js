import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
  // get user datail form forntend
  // validation - not empty
  // check if user exist or not: username, email
  // check for images and avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refreshToken field form response
  // check for user creation
  // return response
  const { fullName, email, password, username } = req.body
  // console.log(email, fullName, password, username)

  //validation
  if ([fullName, email, password, username].some(p => p?.trim() === "")) {
    throw new ApiError(400, "all fields are compulsary and required!")
  }

  //check for existance of user in db
  const existedUser = User.findOne({
    $or: [{ email }, { username }]
  })

  if (existedUser) {
    throw new ApiError(409, "user credentials are exists.")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar file is required')
  }

  //upload on cludinary
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, 'avatar file is required')
  }

  const user = User.create({
    fullName,
    avatar: avatar.url,
    username: username.toLowerCase(),
    password,
    coverImage: coverImage?.url || '',
    email
  })

  const createdUser = await User.findById(user._id).select(
    "-refreshToken -password"
  )

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user!")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User Register Successfully!")
  )

})

export { registerUser }