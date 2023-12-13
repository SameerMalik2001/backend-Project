import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const generateAccessAndRefreshToken = async (userId) => {
  try {

    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch {
    throw new ApiError(500, "something went wrong while generating refresh and access token")
  }
}

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

  //validation
  if ([fullName, email, password, username].some(p => p?.trim() === "")) {
    throw new ApiError(400, "All fields are compulsary and required!")
  }

  //check for existance of user in db
  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  })

  // existedUser :  null (if not exists) otherwise it will return object of existed user

  if (existedUser) {
    throw new ApiError(409, "user credentials are exists.")
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path   // these will gives error if avatar is null
  // const coverImageLocalPath = req.files?.coverImage[0]?.path   // these will gives error if coverImageLocalPath is null

  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    avatarLocalPath = req.files.avatar[0].path
  }

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  // avatarLocalPath :  public\temp\WIN_20231104_13_33_10_Pro.jpg  //file path of local direc.

  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar file is required')
  }

  //upload on cludinary
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!avatar) {
    throw new ApiError(400, 'avatar file is required')
  }

  // avatar :  {
  //   asset_id: '05527b8b6a9c99b09e2faafe32ebd1bb',
  //   public_id: 'b7ok3tgccz3rrvow6fo7',
  //   version: 1700753703,
  //   version_id: 'd74029fab7209c5468e28eeb495141fd',
  //   signature: '281fb6252d967a6ff1a2c518382bb7a26129e17b',
  //   width: 1280,
  //   height: 720,
  //   format: 'jpg',
  //   resource_type: 'image',
  //   created_at: '2023-11-23T15:35:03Z',
  //   tags: [],
  //   bytes: 190996,
  //   type: 'upload',
  //   etag: 'ff100d6cba2c3a59db9c9af659f15229',
  //   placeholder: false,
  //   url: 'http://res.cloudinary.com/ddljwrgki/image/upload/v1700753703/b7ok3tgccz3rrvow6fo7.jpg',
  //   secure_url: 'https://res.cloudinary.com/ddljwrgki/image/upload/v1700753703/b7ok3tgccz3rrvow6fo7.jpg',
  //   folder: '',
  //   original_filename: 'WIN_20231104_13_33_10_Pro',
  //   api_key: '584188159818158'
  // }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    username: username.toLowerCase(),
    password,
    coverImage: coverImage?.url || '',
    email
  })

  // user :  {
  //   username: 'tera bhai ha',
  //   email: 'eail@mail.com',
  //   fullName: 'sameer amlik',
  //   avatar: 'http://res.cloudinary.com/ddljwrgki/image/upload/v1700753703/b7ok3tgccz3rrvow6fo7.jpg',
  //   coverImage: 'http://res.cloudinary.com/ddljwrgki/image/upload/v1700753704/weaix1qxsbthxmjempyy.jpg',
  //   watchHistory: [],
  //   password: '$2b$10$b1VOmblZ4i.RIFEPYfugg.RujelHVGUqAZ.OXapWX4tx7YdN.wON.',
  //   _id: new ObjectId('655f71280f310a4b615c0ec5'),
  //   createdAt: 2023-11-23T15:35:04.285Z,
  //   updatedAt: 2023-11-23T15:35:04.285Z,
  //   __v: 0
  // }

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

const loginUser = asyncHandler(async (req, res) => {
  // get user datail form forntend
  // validation - not empty
  // check if user exist or not: username, email
  // return response

  const { username, password, email } = req.body

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  })

  if (!user) {
    throw new ApiError(401, "User is not found!")
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password)

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password is not correct!")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User Logged In Successfully"
    ))

})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out!"))

})

export { registerUser, loginUser, logoutUser }