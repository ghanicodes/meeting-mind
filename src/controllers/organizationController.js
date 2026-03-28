import Organization from "../models/Organization.js";


export const createOrganization = async (req, res) => {
    try {
        const { name, description, email } = req.body;
        const password = `MT@${Math.floor(Math.random() * 1000000)}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const existingOrganization = await Organization.findOne({ email });
        if (existingOrganization) {
            return res.status(400).json({ message: 'Organization with this email already exists' });
        }

        const result = (req.file && req.file.buffer) ? await cloudinaryUpload(req.file.buffer) : null;
        req.logo_id = result?.public_id;



        const newOrganization = new Organization({
            name,
            description,
            logo: {
                url: result?.secure_url,
                public_id: result?.public_id
            },
            email,
            password: hashedPassword,
            role: 'organizer',
        });

        const savedOrganization = await newOrganization.save();


        await sendEmail({
            to: email,
            subject: 'Welcome to meeting minds!',
            template: 'org_welcome',
            context: {
                user_name: name,
                temporary_password: password,
                login_url: 'https://google.com',
                system_name: 'Meeting Minds',
                year: new Date().getFullYear(),
                email: email,

            }
        });
        res.status(201).json({ 
             message: 'Organization created successfully',
             success: true,
             organization: savedOrganization });

        console.log('Organization Created')


    } catch (error) {
        console.log("Create Organization Error", error.message);
        if(!res.headersSent){
            res.status(500).json({
                success: false,
                message: error.message
            });
        }

        if (req.logo_id){
            await cloudinary.uploader.destroy(req.logo_id);
        }
    }
};


export const getOrganizationById = async (req, res) => {
    try {
        const organization = await Organization.find({
            _id: req.params.id,
            role: 'organizer'
        });

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }
        res.status(200).json({ success: true, organization });
    } catch (error) {   
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



export const getAllOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({
            role: 'organizer'
        });

        const organizationsWithStats = await Promise.all(organizations.map(async (org) => {
            const totalMeetings = await Meeting.countDocuments({ organizedBy: org._id });
            return {
                ...org.toObject(),
                totalMeetings,
            };
        }));

        res.status(200).json({
            success: true,
            message: 'Organizations fetched successfully',
            organizations: organizationsWithStats
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};


// Delete Organization
export const deleteOrganization = async (req, res) => {
    try {
        const organizationId = req.params.id;

        await Meeting.deleteMany({ organization: organizationId });

        const organization = await Organization.findByIdAndDelete(organizationId);

        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.status(200).json({ success: true, message: 'Organization and its meetings deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
   
    }
};
