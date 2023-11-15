
// type 1
// const asyncHandler = (fn) => async (res, req, next) =>{
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }


// type 2
const asyncHandler = (requestHandler) =>{
    (res, res, next)=>{
        Promise.resolve(requestHandler(res, req, next)).
        catch((error)=>next(error))
    }
}
export {asyncHandler}