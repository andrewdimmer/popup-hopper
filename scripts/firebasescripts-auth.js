var user;
function loadCurrentUser(authCurrentUser, callback) {
    if (authCurrentUser == null) {
        user = null;
        //console.log("No user logged in");
        for (var i = 0; callback != null && i < callback.length; i++) {
            callback[i]();
        }
    } else {
        userID = authCurrentUser.uid;
        var userPromise = getUserJSON(userID);
        userPromise.then(function(userData) {
            if (userData[0] != null) {
                user = userData[0];
                //console.log("user: " + user);
                for (var i = 0; callback != null && i < callback.length; i++) {
                    callback[i]()
                }
            } else {
                //console.log("Adding new user");
                var userEmail = authCurrentUser.email;
                var userInfo = {
                    "id": userID,
                    "name": authCurrentUser.displayName,
                    "account_email": authCurrentUser.email,
                    "emails": [],
                    "phones": [],
                    "addresses": [],
                    "websites": [],
                    "summaries": [],
                    "certs": [],
                    "skills": [],
                    "resumes": []
                }
                var promise = createUser(userID, userInfo);
                promise.then(function() {
                    addFirstEmail(userEmail, userID);
                    //Popup
                })
            }
        });
    }
}

// Checks if the user is logged in or not
// Displays the login link if they are not
// Displays the profile link if they are
function loginoutnav() {
    if (user) {
        // User is signed in.
        console.log("User is logged in");
        document.getElementById("login-nav").style.display = "none";
        document.getElementById("profile-nav").style.display = "block";
        document.getElementById("resume-nav").style.display = "block";
        document.getElementById("logout-nav").style.display = "block";
    } else {
        console.log("User is not logged in");
        document.getElementById("login-nav").style.display = "block";
        document.getElementById("profile-nav").style.display = "none";
        document.getElementById("resume-nav").style.display = "none";
        document.getElementById("logout-nav").style.display = "none";
    }
}

// Logs the user out
function logout() {
    firebase.auth().signOut().then(function() {
        console.log('Signed Out');
        // addGoodMessage("Logged Out Successfully");
        window.location.href = 'index.html#logout'
    }, function(error) {
        console.error('Sign Out Error', error);
        
    });
}

function addFirstEmail(userEmail, userID) {
    iID = "email-" + generateID(10);
    var newItem = db.collection("items").doc(iID);
    console.log(iID + " reserved");
    var two;
    var one = newItem.get().then(function(doc) {
        if (doc.exists) {
            console.log(iID + " exists");
            console.log("Duplicate ID. Trying again...");
            addFirstEmail();
        } else {
            console.log(iID + " does not exist");
            newItem.set({
                "id": iID,
                "value": userEmail
            })
            .then(function() {
                console.log("Document successfully written!");
                var DBUser = db.collection("users").doc(userID);
                two = DBUser.get().then(function(doc) {
                    if (doc.exists) {
                        // console.log("Document data:", doc.data());
                        userData = doc.data();
                        userData["emails"].push(iID);
                        DBUser.set(userData)
                        .then(function() {
                            console.log("Document successfully written!");
                            loadCurrentUser(auth.currentUser, [getInfo]);
                            //addGoodMessage("Element Added Successfully");
                        })
                        .catch(function(error) {
                            console.error("Error writing document: ", error);
                        });
                        return 0;
                    } else {
                        console.log("Error: parent does not exist!");
                        return 1;
                    }
                }).catch(function(error) {
                    console.log("Error getting document:", error);
                });
            }).catch(function(error) {
                console.error("Error writing document: ", error);
            });
            return 0;
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
    return Promise.all([one,two]);
}


function removeIDFromArray(array, iID) {
    var newArray = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i].indexOf(iID) < 0) {
            newArray.push(array[i]);
        }
    }
    return newArray;
} 

function generateID(length) {
    var id = "";
    var allIDChars= "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (var i = 0; i < length; i++) {
        id += allIDChars[Math.floor(Math.random()*allIDChars.length)];
    }
    return id;
}