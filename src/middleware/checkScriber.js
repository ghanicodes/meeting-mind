async function checkScriber(req , res , next) {
    try {
        let user = req.user;
        if (user.role !== 'scriber') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to perform this action'
            })  

        }

        next()
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while checking user authorization'
        })
    }
}

export default checkScriber;