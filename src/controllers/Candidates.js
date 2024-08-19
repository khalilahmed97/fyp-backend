const connectionDB = require("../config/dbConfig.js");
const fs = require('fs');
const path = require('path');
const util = require('util');

const addCandidate = (req, res) => {
    const {
        cnic,
        name,
        email,
        gender,
        membershipNumber,
        organization,
        position,
        pic,
        cnicPic
    } = req.body;

    if (!name || !cnic || !email || !gender || !membershipNumber || !organization || !position || !pic || !cnicPic) {
        return res.status(200).send("All fields are required");
    }

    const cnicImageName = `${cnic}.jpg`;

    const cnicBackImagePath = path.join('uploads', 'candidates', 'cnic_front', cnicImageName);
    const cnicBackImageBuffer = Buffer.from(cnicPic.front.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const cnicFrontImagePath = path.join('uploads', 'candidates', 'cnic_back', cnicImageName);
    const cnicFrontImageBuffer = Buffer.from(cnicPic.back.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const imageName = `${cnic}.jpg`;
    const imagePath = path.join('uploads', 'candidates', 'image', imageName);
    const imageBuffer = Buffer.from(pic.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const searchStatement = `SELECT * FROM candidates WHERE cnic = $1 OR email_address = $2`;
    const insertStatement = `INSERT INTO candidates (name, cnic, email_address, organization, membership_number, gender, position_applied) VALUES ($1,$2,$3,$4,$5,$6,$7)`;

    connectionDB.query(searchStatement, [cnic, email], (err, results) => {
        if (err) {
            return res.status(500).send("Error Occurred in Database Connection! ");
        }
        if (results.rows.length > 0) {
            return res.status(200).send("Error! Candidate is Already Registered!" );
        }


        // Create directories if they do not exist
        fs.mkdir(path.join('uploads', 'candidates', 'image'), { recursive: true }, (err) => {
            if (err) {
                return res.status(500).send("Error creating directory! " + err );
            }

            fs.writeFile(imagePath, imageBuffer, (err) => {
                if (err) {
                    return res.status(500).send('Error saving user image');
                }



                fs.mkdir(path.join('uploads', 'candidates', 'cnic_back'), { recursive: true }, (err) => {
                    if (err) {
                        return res.status(500).send("Error creating directory! " + err );
                    }

                    fs.writeFile(cnicBackImagePath, cnicBackImageBuffer, (err) => {
                        if (err) {
                            return res.status(500).send('Error saving cnic image');
                        }

                    });

                })

                fs.mkdir(path.join('uploads', 'candidates', 'cnic_front'), { recursive: true }, (err) => {
                    if (err) {
                        return res.status(500).send("Error creating directory! " + err );
                    }



                    fs.writeFile(cnicFrontImagePath, cnicFrontImageBuffer, (err) => {
                        if (err) {
                            return res.status(500).send('Error saving cnic image');
                        }


                        // Now insert the candidate into the database
                        connectionDB.query(insertStatement, [name, cnic, email, organization, membershipNumber, gender, position], (err, results) => {
                            if (err) {
                                return res.status(500).send("ERROR OCCURRED in DB! " + err );
                            }
                            return res.status(200).send("Candidate Form Submitted Successfully!" );
                        });
                    });
                });
            });
        });
    });
};
const getAllCandidates = (req, res) => {
    const searchStatement = "SELECT * FROM candidates";
    try {
        connectionDB.query(searchStatement, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Error Occurred! " + err });
            }
            if (results.rows.length > 0) {
                return res.status(200).send(results.rows);
            }
        });
    } catch (err) {
        return res.status(500).json({ message: "ERROR OCCURRED! " + err });
    }
};
const getAllAcceptedCandidates = (req, res) => {
    const searchStatement = "SELECT * FROM accepted_candidates";
    
    try {
        connectionDB.query(searchStatement, (err, results) => {
            if (err) {
                return res.status(500).json({ message: "ERROR OCCURRED! " + err });
            }

            if (results.rows.length > 0) {
                // Add image path to each candidate
                const candidates = results.rows.map(candidate => {
                    const imagePath = path.join('uploads','candidates','image', `${candidate.cnic}.jpg`);
                    let imageData = null;
                    
                    try {
                        if (fs.existsSync(imagePath)) {
                            imageData = fs.readFileSync(imagePath, { encoding: 'base64' });
                        }
                    } catch (err) {
                        console.error('Error reading image file:', err);
                    }
                    
                    return {
                        ...candidate,
                        imageData: imageData ? `data:image/jpeg;base64,${imageData}` : null
                    };
                });

                return res.status(200).send(candidates);
            } else {
                return res.status(200).send([]);
            }
        });
    } catch (err) {
        return res.status(500).json({ message: "ERROR OCCURRED! " + err });
    }
};
const getSpecificCandidate = async (req, res) => {
    const id = req.params.id;
    const searchStatement = `SELECT * FROM candidates WHERE cnic = $1`;
    const readFile = util.promisify(fs.readFile);

    try {
        connectionDB.query(searchStatement, [id], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ message: "Error Occurred! " + err });
            }
            if (results.rows.length > 0) {
                const candidate = results.rows[0];

                const imagePath = path.join(__dirname, '../../uploads/candidates/image', `${id}.jpg`); // Modify the path as needed
                const cnicFrontImagePath = path.join(__dirname, '../../uploads/candidates/cnic_front', `${id}.jpg`); // Modify the path as needed
                const cnicBackImagePath = path.join(__dirname, '../../uploads/candidates/cnic_back', `${id}.jpg`); // Modify the path as needed

                try {

                    const [imageData, cnicFrontImageData, cnicBackImageData] = await Promise.all([
                        readFile(imagePath),
                        readFile(cnicFrontImagePath),
                        readFile(cnicBackImagePath)
                    ]);

                    candidate.image = imageData.toString('base64');
                    candidate.cnic_front = cnicFrontImageData.toString('base64');
                    candidate.cnic_back = cnicBackImageData.toString('base64');

                    return res.status(200).json(candidate);
                } catch (err) {
                    console.error('Error reading images:', err);
                    return res.status(500).json({ message: "Error Reading Images! " + err });
                }

            } else {
                console.warn('Candidate not found for ID:', id);
                return res.status(404).json({ message: "Candidate Not Found!" });
            }
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ message: "ERROR OCCURRED! " + err });
    }
};
const disapproveCandidate = async (req, res) => {
    const { id } = req.params;
    const queryStatement = "UPDATE candidates SET status = 'Disapprove' WHERE cnic = $1";
    const deleteStatement = "DELETE FROM accepted_candidates WHERE cnic = $1";

    try {
        connectionDB.query(queryStatement, [id], (err, result) => {
            if (err) {
                return res.status(500).send("Error Occurred! " + err );
            }
            if (result.rowCount > 0) {

                connectionDB.query(deleteStatement, [id], (err, result) => {
                    if (err) {
                        return res.status(500).send("Error Occurred! " + err );
                    }
                    if (result.rowCount > 0) {
        
                        return res.status(200).send("Candidate Disapproved and Deleted From Approved List" );
                    } else {
                        return res.status(200).send("Candidate Disapproved" );
                    }
            })
               
            } else {
                return res.status(404).send("Candidate not found" );
            }
        });
    } catch (err) {
        return res.status(500).send(err.message);
    }
};
const approveAndAddToAcceptedList = async (req, res) => {
    const { id } = req.params;
    const updateQuery = "UPDATE candidates SET status='Approve' WHERE cnic=$1";
    const selectQuery = "SELECT * FROM candidates WHERE cnic = $1";
    const selectQueryForAccepted = "SELECT * FROM accepted_candidates WHERE cnic=$1";
    const insertQuery = "INSERT INTO accepted_candidates (name, cnic, email_address, organization, membership_number, gender, position_applied) VALUES ($1,$2,$3,$4,$5,$6,$7)";

    try {
        // Approve the candidate
        connectionDB.query(updateQuery, [id], (err, updateResult) => {
            if (err) {
                return res.status(500).send("Error occurred while approving candidate: " + err.message);
            }
            if (updateResult.rowCount > 0) {
                // Fetch candidate details
                connectionDB.query(selectQuery, [id], (err, selectResult) => {
                    if (err) {
                        return res.status(500).send("Error occurred while fetching candidate details: " + err.message );
                    }
                    if (selectResult.rows.length > 0) {

                        const { name, cnic, email_address, organization, membership_number, gender, position_applied } = selectResult.rows[0];

                        connectionDB.query(selectQueryForAccepted, [cnic], (err, searchResult) => {
                            if (err) {
                                return res.status(500).send("Error occurred while searching in accepted candidate list: " + err.message );
                            }
                            if (searchResult.rows.length > 0) {
                                return res.status(200).send("Candidate Already Added to Accepted List!" );
                            }
                            else {
                                // Add candidate to the accepted list
                                connectionDB.query(insertQuery, [name, cnic, email_address, organization, membership_number, gender, position_applied], (err, insertResult) => {
                                    if (err) {
                                        return res.status(500).send("Error occurred while adding candidate to accepted list: " + err.message );
                                    }
                                    return res.status(200).send("Candidate approved and added to the accepted list successfully!" );
                                });
                            }
                        });
                    } else {
                        return res.status(403).send("Candidate not found after approval");
                    }
                });
            } else {
                return res.status(404).json({ message: "Candidate not found for approval" });
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
const getCandidates = async (req, res) => {

    const queryStatement = "SELECT * FROM accepted_candidates WHERE position_applied=$1"
    const { id } = req.params;

    try {
        connectionDB.query(queryStatement, [id], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error Occurred! " + err });
            }
            if (result.length > 0) {
                return res.status(200).send(result);
            }
            else if (result.length === 0) {
                return res.status(200).send([]);
            }
            else {
                return res.status(404).send({ message: "Candidate not found" });
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}
module.exports = { getCandidates, addCandidate, getAllCandidates, approveAndAddToAcceptedList, disapproveCandidate, getAllAcceptedCandidates, getSpecificCandidate };
