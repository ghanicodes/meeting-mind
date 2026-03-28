import jwt from "jsonwebtoken"
import User from "../models/User.js";

async function checkAuth(req , res , next) {
    try {
        let token = req.cookies.token;
        

        if(!token){
            return res.status(401).json({
                success: false,
                isLogin: false,
                message: 'Unauthorized',
                isUnAuthorized: true
            })
        }

        let decode = jwt.verify(token , process.env.JWT_SECRET);

        if (!decode) {
            res.status(401).json({
                success: false,
                isLogin: false,
                message: 'Unauthorized'
            })
        }


        let user = await User.findById(decode.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                isLogin: false,
                message: 'User not found'
            })
        }

        req.user = user;

        next()

    } catch (error) {

        res.status(500).json({
            success: false,
            isLogin: false,
            message: error.message,
            isUnAuthorized: true
        })

    }
}

export default checkAuth;