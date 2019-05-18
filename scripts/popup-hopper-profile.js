// Creates a new user account directly after the user signs up.
function createUserAccount(parameters) {
    var one, two, three;
    if (parameters.type == 0) {
        three = true;
        cID = "c-" + generateID(10);
        var newClient = db.collection("clients").doc(cID);
        console.log(cID + " reserved");
        one = newClient.get().then(function(doc) {
            if (doc.exists) {
                console.log(cID + " exists");
                console.log("Duplicate ID. Trying again...");
                createUserAccount(parameters);
            } else {
                console.log(cID + " does not exist");
                newClient.set({
                    "Demographics": {
                        "BirthYear": parameters.year,
                        "Gender": parameters.gender,
                        "Income": parameters.income,
                        "Race": parameters.race
                    },
                    "Photo": parameters.photo,
                    "Interests": parameters.interests,
                    "Following": [],
                    "cID": cID,
                    "uID": uID
                }).then(function() {
                    var newUser = db.collection("users").doc(uID);
                    two = newUser.get().then(function(doc) {
                        if (doc.exists) {
                            console.log("ERROR! User already exists!")
                        } else {
                            console.log("Creating new user!");
                            newUser.set({
                                "uID": parameters.uID,
                                "Name": parameters.name,
                                "Email": parameters.email,
                                "Messages": [],
                                "Profiles": [cID],
                                "LastCheckedMessages": 0,
                                "NewestMessage": 0
                            })
                            .then(function() {
                                console.log("Document successfully written!");
                                window.location.href = "index.html"
                            })
                            .catch(function(error) {
                                console.error("Error writing document: ", error);
                            });
                        }
                    }).catch(function(error) {
                        console.log("Error getting document:", error);
                    });
                }).catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    } else if (parameters.type == 1) {
        cID = "b-" + generateID(10);
        var newBusiness = db.collection("businesses").doc(bID);
        console.log(bID + " reserved");
        one = newBusiness.get().then(function(doc) {
            if (doc.exists) {
                console.log(bID + " exists");
                console.log("Duplicate ID. Trying again...");
                createUserAccount(parameters);
            } else {
                console.log(bID + " does not exist");
                newBusiness.set({
                    "Name": parameters.businessName,
                    "Description": parameters.description,
                    "Logo": parameters.logo,
                    "Locations": [],
                    "Followers": [],
                    "Category": parameters.category,
                    "bID": bID,
                    "uID": uID
                }).then(function() {
                    var newUser = db.collection("users").doc(uID);
                    two = newUser.get().then(function(doc) {
                        if (doc.exists) {
                            console.log("ERROR! User already exists!")
                        } else {
                            console.log("Creating new user!");
                            newUser.set({
                                "uID": parameters.uID,
                                "Name": parameters.name,
                                "Email": parameters.email,
                                "Messages": [],
                                "Profiles": [bID],
                                "LastCheckedMessages": 0,
                                "NewestMessage": 0
                            })
                            .then(function() {
                                console.log("Document successfully written!");
                                var updateInterests = db.collection("interests").doc(parameters.category);
                                three = updateInterests.get().then(function(doc) {
                                    if (doc.exists) {
                                        var catData = doc.data();
                                        catData[Businesses].push(bID);
                                        updateInterests.set(catData);
                                    } else {
                                        console.log("ERROR! Category does not exist!");
                                    }
                                }).catch(function(error) {
                                    console.log("Error getting document:", error);
                                });
                            })
                            .catch(function(error) {
                                console.error("Error writing document: ", error);
                            });
                        }
                    }).catch(function(error) {
                        console.log("Error getting document:", error);
                    });
                }).catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    } else {
        console.log("Invalid Type Error!");
    }
    return Promise.all([one,two, three]);
}

function follow(bID, uID, cID) {
    db.collection("clients").doc(cID).get().then(function(doc) {
        if (doc.exists) {
            var userData = doc.data();
            userData.Following.push({
                "Level": 1,
                "bID": bID
            });
            followingUser.set(userData).then(function() {
                db.collection("businesses").doc(bID).transaction(function(data) {
                    data.Followers.push({
                        "Level": 1,
                        "cID": cID,
                        "uID": uID
                    });
                    alert("Followed");
                });
            }).catch(function(error) {
                console.error("Error writing document: ", error);
            });
        } else {
            console.log("Error! User does not exist!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function addMessage(subject, message, bID) {
    db.collection("businesses").doc(bID).get().then(function(doc) {
        if (doc.exists) {
            var businessData = doc.data();
            for (var i = 0; i < businessData.Followers.length; i++){
                db.collection("users").doc(businessData.Followers[i].uID).transaction(function(data) {
                    data.Messages.unshift({
                        "Sender": businessData.Name,
                        "Time": (new Date()).toDateString(),
                        "Subject": subject,
                        "Message": message
                    });
                });
            }
            alert("Message Sent!");
        } else {
            console.log("Error! User does not exist!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}