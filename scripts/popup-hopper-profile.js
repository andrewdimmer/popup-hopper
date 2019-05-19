var debug = false;

// Creates a new user account directly after the user signs up.
function createClientAccount() {
    var interests = [];
    if (document.getElementById("ArtC").value) {
        interests.push("Art");
    }
    if (document.getElementById("FashionC").value) {
        interests.push("Fashion");
    }
    if (document.getElementById("FoodC").value) {
        interests.push("Food");
    }
    if (document.getElementById("HealthC").value) {
        interests.push("Heath");
    }
    if (document.getElementById("MusicC").value) {
        interests.push("Music");
    }
    if (document.getElementById("SportsC").value) {
        interests.push("Sports");
    }
    if (document.getElementById("TextilesC").value) {
        interests.push("Textiles");
    }
    var parameters = {
        "name": document.getElementById("clientName").value,
        "email": document.getElementById("clientEmail").value,
        "photo": document.getElementById("clientPhoto").value,
        "year": document.getElementById("clientYear").value,
        "gender": document.forms["clientForm"].getElementsByTagName("gender").value,
        "income": document.forms["clientForm"].getElementsByTagName("income").value,
        "race": document.forms["clientForm"].getElementsByTagName("race").value,
        "interests": interests
    };
    
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
                    //"Gender": parameters.gender,
                    //"Income": parameters.income,
                    //"Race": parameters.race
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
}

function createBusinessAccount() {
    var interests = [];
    if (document.getElementById("ArtB").value) {
        interests.push("Art");
    }
    if (document.getElementById("FashionB").value) {
        interests.push("Fashion");
    }
    if (document.getElementById("FoodB").value) {
        interests.push("Food");
    }
    if (document.getElementById("HealthB").value) {
        interests.push("Heath");
    }
    if (document.getElementById("MusicB").value) {
        interests.push("Music");
    }
    if (document.getElementById("SportsB").value) {
        interests.push("Sports");
    }
    if (document.getElementById("TextilesB").value) {
        interests.push("Textiles");
    }
    var parameters = {
        "contactName": document.getElementById("contactName").value,
        "businessName": document.getElementById("businessName").value,
        "email": document.getElementById("contactEmail").value,
        "logo": document.getElementById("businessLogo").value,
        "description": document.getElementById("businessDescription").value,
        "category": interests[0]
    };
    
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
                    var updateMaster = db.collection("businesses").doc("Temp");
                    db.runTransaction(function(transaction) {
                        // This code may get re-run multiple times if there are conflicts.
                        return transaction.get(updateMaster).then(function(masterDoc) {
                            if (!masterDoc.exists) {
                                console.log("Document does not exist!");
                            }
                            var all = masterDoc.data().All;
                            all.push({"bID":bID,"BusinessName":parameters.businessName});
                            transaction.update(updateMaster, {All: all});
                        });
                    }).then(function() {
                        console.log("Transaction successfully committed!");
                        window.location.href = "index.html";
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
            //alert("Success!");
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
            //alert("Success!");
        }).catch(function(error) {
            console.log("Transaction failed: ", error);
        });
    }).catch(function(error) {
        console.log("Transaction failed: ", error);
    });
}

function submitMessage() {
    sendMessage(document.getElementById("subject").value,document.getElementById("message").value);
    document.getElementById("subject").value = null;
    document.getElementById("message").value = null;
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
        "description": document.getElementById("locationDescription").value,
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
                                var message = businessData.BusinessName + " wil have a pop-up shop at " + parameters.street + ", " + parameters.city + ", " + parameters.state + " " + parameters.zip + " from " +  parameters.startDate.toString() + " to " +  parameters.stopDate.toString() + ". Come check it out!</br></br>More info avaliable at <a href=" + location.href + "?id=" + businessData.bID + ">" + location.href + "?id=" + businessData.bID + "</a>.";
                                console.log(subject);
                                console.log(message);
                                sendMessage(subject, message);
                                
                                document.getElementById("street").value = null;
                                document.getElementById("city").value = null;
                                document.getElementById("state").value = "State";
                                document.getElementById("zipcode").value = null;
                                document.getElementById("street").value = null;
                                document.getElementById("startDate").value = null;
                                document.getElementById("startTime").value = null;
                                document.getElementById("stopDate").value = null;
                                document.getElementById("stopTime").value = null;
                                document.getElementById("locationDescription").value = null;
                                document.getElementById("featured").value = null;
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

function displayBusinessData(bID, clientView) {
    var oldLocationNumber, oldPicture, oldName, oldDescription, oldFollows;
    db.collection("businesses").doc(bID)
    .onSnapshot(function(doc) {
        if (!doc.exists) {
            console.log("ERROR! " + bID + " does not exist!");
        } else {
            if (location.href.indexOf("business-profile-page.html") > 0) {
                if (oldLocationNumber == undefined || oldLocationNumber != doc.data().Locations.length) {                
                    oldLocationNumber = doc.data().Locations.length;
                    var locationsPromise = getLocations(doc.data().Locations);
                    locationsPromise.then(function(locations) {
                        locations.sort(compareLocations);
                        var locationString = "";
                        for (var i = 0; i < oldLocationNumber; i++) {
                            var currentLocation = locations[i];
                            if (currentLocation == null) {
                                continue;
                            }
                            console.log(currentLocation.DateTime.StopInt);
                            if (currentLocation.DateTime.StopInt > (new Date()).getTime()) {
                                var featuredURL = "assets/stockImages/iconfinder_t-shirt_115785.png";
                                if (currentLocation.Featured.indexOf("http") > -1) {
                                    featuredURL = currentLocation.Featured;
                                }
                                locationString += "<div class='location'><h5>" + currentLocation.Address.City + ", " + currentLocation.Address.State + "</h5><img src=" + featuredURL + " class='locationImage lockSize'><p>" + currentLocation.Address.String + "</p><p>" + currentLocation.DateTime.StartString + " - " + currentLocation.DateTime.StopString + "</p><p>" + currentLocation.Description + "</p></div>";
                            }
                        }
                        if (locationString.length > 0) {
                            document.getElementById("locations").innerHTML = locationString;
                        } else {
                            document.getElementById("locations").innerHTML = "No current or future locations listed!";
                        }
                    });
                }
                if (oldName == undefined || !(oldName.indexOf(doc.data().BusinessName) == 0 && doc.data().BusinessName.indexOf(oldName) == 0)) {
                    oldName = doc.data().BusinessName;
                    document.getElementById("businessName").innerHTML = doc.data().BusinessName;
                }
                if (oldDescription == undefined || !(oldDescription.indexOf(doc.data().Description) == 0 && doc.data().Description.indexOf(oldDescription) == 0)) {
                    oldDescription = doc.data().Description;
                    document.getElementById("description").innerHTML = doc.data().Description;
                }
                if (oldPicture == undefined || !(oldPicture.indexOf(doc.data().Logo) == 0 && doc.data().Logo.indexOf(oldPicture) == 0)) {
                    oldPicture = doc.data().Logo;
                    if (doc.data().Logo.indexOf("http") > -1) {
                        document.getElementById("logo").src = doc.data().Logo;
                    } else {
                        document.getElementById("logo").src = "assets/stockImages/iconfinder_app_type_real_state_512px_GREY_287479.png"
                    }
                }
                if (oldFollows == undefined || oldFollows != doc.data().Followers.length) {
                    oldFollows = doc.data().Followers.length;
                    if (doc.data().Followers.length == 0) {
                        document.getElementById("follows").innerHTML = "";
                    } else if (doc.data().Followers.length == 1) {
                        document.getElementById("follows").innerHTML = "1 Follower";
                    } else {
                        document.getElementById("follows").innerHTML = (doc.data().Followers.length + " Followers");
                    }
                    if (clientView) {
                        var cID = document.cookie.substring(document.cookie.indexOf("=")+1);
                        var following = false;
                        for (var i = 0; i < doc.data().Followers.length; i++) {
                            if (doc.data().Followers[i].cID.indexOf(cID) > -1) {
                                document.getElementById("UnfollowButton").setAttribute("onclick", "unfollow('" + bID + "')");
                                document.getElementById("FollowButton").style.display = "none";
                                document.getElementById("UnfollowButton").style.display = "";
                                following = true;
                                break;
                            }
                        }
                        if (!following) {
                            document.getElementById("FollowButton").setAttribute("onclick", "follow('" + bID + "')");
                            document.getElementById("UnfollowButton").style.display = "none";
                            document.getElementById("FollowButton").style.display = "";
                        }
                    }
                }
            }
            console.log("Current data: ", doc.data());
        }
    });
}

function getLocations(locationArray) {
    var completed = [];
    for (var i = 0; i < locationArray.length; i++) {
        var locationRef = db.collection("locations").doc(locationArray[i]);
        completed.push(locationRef.get().then(function (doc) {
            if (doc.exists) {
                return doc.data();
            } else {
                return null;
            }
        }).catch(function (error) {
            console.log("Error getting document:", error);
        }));
    }
    return Promise.all(completed);
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
            if (location.href.indexOf("messages.html") > -1 && doc.data().Messages.length > 0) {
                var messagesString = ""
                for (var i = 0; i < doc.data().Messages.length; i++) {
                    messagesString += "<div class='message'><h5>" + doc.data().Messages[i].Subject + "</h5><h6>" + doc.data().Messages[i].Sender + "</h6><p><em>" + doc.data().Messages[i].Date + "</em></p><p>" + doc.data().Messages[i].Message + "</p></div>";
                }
                document.getElementById("messages").innerHTML = messagesString;
            }
            if (location.href.indexOf("index.html") > -1) {
                var listBiz = db.collection("businesses").doc("Temp");
                listBiz.get().then(function (bizList) {
                    console.log(bizList.data().All);
                    for (var i = 0; i < bizList.data().All.length; i++) {
                        console.log(bizList.data().All[i]);
                        var url = location.href.substring(0,location.href.lastIndexOf("/")) + "/business-profile-page.html?id=" + bizList.data().All[i].bID;
                        document.getElementById("businessList").innerHTML += "<h2><a href='" + url + "' >" + bizList.data().All[i].BusinessName + "</a></h2>";
                    }
                });
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
    var email = document.getElementById("userEmail").value;
    var currentURL = location.href.substring(0,location.href.lastIndexOf("/"));
    var found = false;
    var userLoggingIn = db.collection("clients").where("Email","==",email)
    userLoggingIn.get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
        alert("Email found! In the future, you will receive this login link in an email. Currently, just go to " + currentURL + "/?id=" + doc.data().cID + " to login as " + doc.data().Name + ".");
        found = true;
    });
    });
}

function compareLocations(a, b) {
  return a.DateTime.StartInt - b.DateTime.StartInt;
}

function search() {
    var found = false;
    var searchString = document.getElementById("searchBar").value;
    var businessSearch = db.collection("businesses").where("BusinessName", "==", searchString);
    businessSearch.get().then(function (querySnapshot) {
        querySnapshot.forEach(function (doc) {
            location.href = location.href.substring(0,location.href.lastIndexOf("/")) + "/business-profile-page.html?id=" + doc.data().bID;
        }).then(function(){
            if (!found) {
                alert("No businesses found with that name!");
            }
        });
    })
}