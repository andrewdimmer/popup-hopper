// Creates a new user account directly after the user signs up.
function createUserAccount(parameters) {
    if (parameters.type == 0) {
        three = true;
        var cID = "c-" + generateID(10);
        var newClient = db.collection("clients").doc(cID);
        console.log(cID + " reserved");
        newClient.get().then(function(doc) {
            if (doc.exists) {
                console.log(cID + " exists");
                console.log("Duplicate ID. Trying again...");
                createUserAccount(parameters);
            } else {
                console.log(cID + " does not exist");
                document.cookie = "id=" + cID;
                newClient.set({
                    "Name": parameters.name,
                    "Email": parameters.email,
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
                    "Messages": []
                }).then(function() {
                    window.location.href = "index.html"
                }).catch(function(error) {
                    console.error("Error writing document: ", error);
                });
            }
        }).catch(function(error) {
            console.log("Error getting document:", error);
        });
    } else if (parameters.type == 1) {
        var bID = "b-" + generateID(10);
        var newBusiness = db.collection("businesses").doc(bID);
        console.log(bID + " reserved");
        newBusiness.get().then(function(doc) {
            if (doc.exists) {
                console.log(bID + " exists");
                console.log("Duplicate ID. Trying again...");
                createUserAccount(parameters);
            } else {
                console.log(bID + " does not exist");
                document.cookie = "id=" + bID;
                newBusiness.set({
                    "ContactName": parameters.contactName,
                    "ContactEmail": parameters.email,
                    "BusinessName": parameters.businessName,
                    "Description": parameters.description,
                    "Logo": parameters.logo,
                    "Locations": [],
                    "Followers": [],
                    "Category": parameters.category,
                    "bID": bID,
                }).then(function() {
                    console.log("Document successfully written!");
                    var updateInterests = db.collection("interests").doc(parameters.category);
                    db.runTransaction(function(transaction) {
                        // This code may get re-run multiple times if there are conflicts.
                        return transaction.get(updateInterests).then(function(interestDoc) {
                            if (!interestDoc.exists) {
                                console.log("Document does not exist!");
                            }
                            var businesses = interestDoc.data().Businesses;
                            businesses.push(bID);
                            transaction.update(updateInterests, {Businesses: businesses});
                        });
                    }).then(function() {
                        console.log("Transaction successfully committed!");
                        window.location.href = "index.html";
                    }).catch(function(error) {
                        console.log("Transaction failed: ", error);
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
}

function follow(bID) {
    var cID = document.cookie.substring(document.cookie.indexOf("=")+1);
    var followingUser = db.collection("clients").doc(cID);
    db.runTransaction(function(transaction) {
        // This code may get re-run multiple times if there are conflicts.
        return transaction.get(followingUser).then(function(userDoc) {
            if (!userDoc.exists) {
                console.log("Document does not exist!");
            }
            var following = userDoc.data().Following;
            following.push({"Level": 1, "bID": bID});
            transaction.update(followingUser, {Following: following});
        });
    }).then(function() {
        console.log("Transaction successfully committed!");
        var followedBusiness = db.collection("businesses").doc(bID);
        db.runTransaction(function(transaction) {
            // This code may get re-run multiple times if there are conflicts.
            return transaction.get(followedBusiness).then(function(businessDoc) {
                if (!businessDoc.exists) {
                    console.log("Document does not exist!");
                }
                var followers = businessDoc.data().Followers;
                followers.push({"Level": 1, "cID": cID});
                transaction.update(followedBusiness, {Followers: followers});
            });
        }).then(function() {
            console.log("Transaction successfully committed!");
            alert("Success!");
        }).catch(function(error) {
            console.log("Transaction failed: ", error);
        });
    }).catch(function(error) {
        console.log("Transaction failed: ", error);
    });
}

function sendMessage(subject, message) {
    var bID = document.cookie.substring(document.cookie.indexOf("=")+1);
    db.collection("businesses").doc(bID).get().then(function(doc) {
        if (doc.exists) {
            var businessData = doc.data();
            sent = 0;
            for (var i = 0; i < businessData.Followers.length; i++){
                var userToMessage = db.collection("clients").doc(businessData.Followers[i].cID);
                db.runTransaction(function(transaction) {
                    // This code may get re-run multiple times if there are conflicts.
                    return transaction.get(userToMessage).then(function(userDoc) {
                        if (!userDoc.exists) {
                            console.log("Document does not exist!");
                        }
                        var messages = userDoc.data().Messages;
                        messages.unshift({
                            "Subject": subject,
                            "Message": message,
                            "Sender": businessData.BusinessName,
                            "Date": (new Date()).toDateString()
                        });
                        transaction.update(userToMessage, {Messages: messages});
                    });
                }).then(function() {
                    console.log("Transaction successfully committed!");
                    sent++;
                    if (sent == businessData.Followers.length) {
                        alert("All Messages Sent!");
                    }
                }).catch(function(error) {
                    console.log("Transaction failed: ", error);
                });
            }
        } else {
            console.log("Error! User does not exist!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}