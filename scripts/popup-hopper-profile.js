// Creates a new user account directly after the user signs up.
function createUserAccount(parameters) {
    if (parameters.type == 0) {
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

function unfollow(bID) {
    var cID = document.cookie.substring(document.cookie.indexOf("=")+1);
    var followingUser = db.collection("clients").doc(cID);
    db.runTransaction(function(transaction) {
        // This code may get re-run multiple times if there are conflicts.
        return transaction.get(followingUser).then(function(userDoc) {
            if (!userDoc.exists) {
                console.log("Document does not exist!");
            }
            var following = userDoc.data().Following;
            var unfollowed = [];
            for (var i = 0; i < following.length; i++) {
                console.log(following[i].bID);
                if (following[i].bID.indexOf(bID) < 0) {
                    unfollowed.push(following[i]);
                }
            }
            transaction.update(followingUser, {Following: unfollowed});
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
                var unfollowed = [];
                for (var i = 0; i < followers.length; i++) {
                    if (followers[i].cID.indexOf(cID) < 0) {
                        unfollowed.push(following[i]);
                    }
                }
                transaction.update(followedBusiness, {Followers: unfollowed});
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
            if (businessData.Followers.length == 0) {
                alert("Success!");
                return 0;
            }
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
                            "Date": (new Date()).toString()
                        });
                        transaction.update(userToMessage, {Messages: messages});
                    });
                }).then(function() {
                    console.log("Transaction successfully committed!");
                    sent++;
                    if (sent == businessData.Followers.length) {
                        alert("Success!");
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

function addLocation() {
    var complete;
    var parameters = {
        "street": document.getElementById("street").value,
        "city": document.getElementById("city").value,
        "state": document.getElementById("state").value,
        "zip": document.getElementById("zipcode").value,
        "street": document.getElementById("street").value,
        "startDate": new Date(document.getElementById("startDate").value + " " + document.getElementById("startTime").value),
        "stopDate": new Date(document.getElementById("stopDate").value + " " + document.getElementById("stopTime").value),
        "description": document.getElementById("description").value,
        "featured": document.getElementById("featured").value,
    }
    
    var bID = document.cookie.substring(document.cookie.indexOf("=")+1);
    var business = db.collection("businesses").doc(bID);
    business.get().then(function(doc) {
        if (doc.exists) {
            var businessData = doc.data();
            var lID = "l-" + generateID(10);
            var newLocation = db.collection("locations").doc(lID);
            console.log(lID + " reserved");
            newLocation.get().then(function(doc) {
                if (doc.exists) {
                    console.log(lID + " exists");
                    console.log("Duplicate ID. Trying again...");
                    addLocation(paremeters);
                } else {
                    console.log(lID + " does not exist");
                    newLocation.set({
                        "BusinessName": businessData.BusinessName,
                        "Logo": businessData.Logo,
                        "Category": businessData.Category,
                        "Address": {
                            "Street": parameters.street,
                            "City": parameters.city,
                            "State": parameters.state,
                            "Zip": parameters.zip,
                            "String": parameters.street + ", " + parameters.city + ", " + parameters.state + " " + parameters.zip
                        },
                        "DateTime":{
                            "StartString": parameters.startDate.toString(),
                            "StopString": parameters.stopDate.toString(),
                            "StartInt": parameters.startDate.getTime(),
                            "StopInt": parameters.stopDate.getTime()
                        },
                        "Featured": parameters.featured,
                        "Description": parameters.description,
                        "lID": lID,
                        "bID": businessData.bID
                    }).then(function() {
                        db.runTransaction(function(transaction) {
                            // This code may get re-run multiple times if there are conflicts.
                            return transaction.get(business).then(function(businessDoc) {
                                if (!businessDoc.exists) {
                                    console.log("Document does not exist!");
                                }
                                var locations = businessDoc.data().Locations;
                                locations.push(lID);
                                transaction.update(business, {Locations: locations});
                            });
                        }).then(function() {
                            console.log("Transaction successfully committed!");
                            var interest = db.collection("interests").doc(businessData.Category);
                            db.runTransaction(function(transaction) {
                                // This code may get re-run multiple times if there are conflicts.
                                return transaction.get(interest).then(function(interestDoc) {
                                    if (!interestDoc.exists) {
                                        console.log("Document does not exist!");
                                    }
                                    var locations = interestDoc.data().Locations;
                                    locations.push(lID);
                                    transaction.update(interest, {Locations: locations});
                                });
                            }).then(function() {
                                console.log("Transaction successfully committed!");
                                var subject = businessData.BusinessName + " has a new pop-up coming soon!";
                                var message = businessData.BusinessName + " wil have a pop-up shop at " + parameters.street + ", " + parameters.city + ", " + parameters.state + " " + parameters.zip + " from " +  parameters.startDate.toString() + " to " +  parameters.stopDate.toString() + ". Come check it out!</br></br>More info avaliable at " + location.href + ".";
                                console.log(subject);
                                console.log(message);
                                sendMessage(subject, message);
                            }).catch(function(error) {
                                console.log("Transaction failed: ", error);
                            });
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
            console.log("ERROR! Docuemnt does not exist!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
}

function displayBusinessData(bID) {
    db.collection("businesses").doc(bID)
    .onSnapshot(function(doc) {
        if (!doc.exists) {
            console.log("ERROR! Docuemnt does not exist!");
        } else {
            console.log("Current data: ", doc.data());
        }
    });
}

function displayClientData(cID) {
    var oldMessageNumber;
    db.collection("clients").doc(cID)
    .onSnapshot(function(doc) {
        if (!doc.exists) {
            console.log("ERROR! Docuemnt does not exist!");
        } else {
            if (oldMessageNumber == undefined) {
                oldMessageNumber = doc.data().Messages.length;
            } else if (oldMessageNumber != doc.data().Messages.length) {
                oldMessageNumber = doc.data().Messages.length;
                alert("New Message!");
            }
            console.log("Current data: ", doc.data());
        }
    });
}

function displayLocationData(lID) {
    var oldMessageNumber;
    db.collection("locations").doc(lID)
    .onSnapshot(function(doc) {
        if (!doc.exists) {
            console.log("ERROR! Docuemnt does not exist!");
        } else {
            console.log("Current data: ", doc.data());
        }
    });
}

function login() {
    var email = document.getElementById("userEmail").value();
    var currentURL = location.href.substring(0,location.href.lastIndexOf("/"));
    var found = false;
    var userLoggingIn = db.collection("clients").where("Email","==",email)
    userLoggingIn.get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
        alert("Email found! In the future, you will receive this login link in an email. Currently, just go to " + currentURL + "/?id=" + doc.data().cID + " to login as " + doc.data().Name + ".");
        found = true;
    }).then(function() {
        userLoggingIn = db.collection("businesses").where("Email","==",email)
        userLoggingIn.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            alert("Email found! In the future, you will receive this login link in an email. Currently, just go to " + currentURL + "/?id=" + doc.data().bID + " to login as " + doc.data().BusinessName + ".");
            found = true;
        }).then(function(){
            if (!found) {
                alert("No users with that email found!");
            }
        });
        });
    });
    });
}