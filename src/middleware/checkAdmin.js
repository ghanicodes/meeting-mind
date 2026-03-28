async function checkAdmin(req , res , next) {
    try {
        let user = req.user;
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to perform this action'
            })
        }
        next()
    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        })
    
    }
}

export default checkAdmin;