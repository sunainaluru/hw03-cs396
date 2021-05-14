"use strict";

const resetDB = require("../config/scripts/populateDB")

const Companion = require("./schema/Companion");
const Doctor = require("./schema/Doctor");

const express = require("express");
const FavoriteDoctor = require("./schema/FavoriteDoctor");
const FavoriteCompanion = require("./schema/FavoriteCompanion");
const e = require("express");
const router = express.Router();


// completely resets your database.
// really bad idea irl, but useful for testing
router.route("/reset")
    .get((_req, res) => {
        resetDB(() => {
            res.status(200).send({
                message: "Data has been reset."
            });
        });
    });

router.route("/")
    .get((_req, res) => {
        console.log("GET /");
        res.status(200).send({
            data: "App is running."
        });
    });
    
// ---------------------------------------------------
// Edit below this line
// ---------------------------------------------------
router.route("/doctors")
    .get((req, res) => {
        console.log("GET /doctors");

        // already implemented:
        Doctor.find({})
            .sort('ordering')
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
                return;
            });
    })
    .post((req, res) => {
        console.log("POST /doctors");

        if (req.body._id) {
            res.status(500).send({"500": `Cannot manually create database id for doctor"${req.params.id}`});
            return;
        }
        
        Doctor.create(req.body).save()
              .then(doctor => {
                  res.status(201).send(doctor);
              })
              .catch(error => {
                console.log("MongoDB error", error)
                res.status(500).send({"500": "Could not create doctor."});
                return;
              });
    });


router.route("/doctors/favorites")
    .get((req, res) => {
        console.log(`GET /doctors/favorites`);

        FavoriteDoctor.find({})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log(`POST /doctors/favorites`);

        Doctor.findOne({"_id": req.body.id})
        .then((doc) => {
            FavoriteDoctor.findOne({"doctor": req.body.id})
            .then((found) => {
                if (found) {
                    res.status(500).send({"500": "Doctor already exists on favorite list."});
                    return;
                } else {
                    FavoriteDoctor.create(req.body.id).save()
                    .then(() => {
                        res.status(201).send(doc);
                    })
                    .catch(error => {
                      console.log("MongoDB error", error)
                      res.status(500).send({"500": "Could not create favorite doctor."});
                      return;
                    });
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find doctor with id in favorites list"${req.params.id}`});
                return;
            });    
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
            return;
        });
    });
    
router.route("/doctors/:id")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}`);
        
        const id = req.params.id
        Doctor.findOne({"_id": id})
            .then(doctor => {
                res.status(200).send(doctor);
            }) 
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
                return;
            });
    })
    .patch((req, res) => {
        console.log(`PATCH /doctors/${req.params.id}`);

        if (req.body._id) {
            res.status(400).send({"400": `Cannot change database id for doctor"${req.params.id}`});
            return;
        }
        
        Doctor.findOneAndUpdate(
            {_id: req.params.id}, 
            req.body,
            { new: true } // means you want to return the updated doctor
        )
        .then((doc) => {
               res.status(200).send(doc);
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(400).send({"400": `Could not update doctor with id "${req.params.id}`});
            return;
        });
    })
    .delete((req, res) => {
        console.log(`DELETE /doctors/${req.params.id}`);
        
        Doctor.findOneAndDelete({ _id: req.params.id })
        .then(() => {
               res.status(200).send();
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(400).send({"400": `Could not delete doctor with id "${req.params.id}`});
            return;
        });
    });
    
router.route("/doctors/:id/companions")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/companions`);

        Doctor.findOne({"_id": req.params.id})
            .then((doc) => {
                if (doc) {
                    Companion.find({"doctors": req.params.id})
                        .sort('ordering')
                        .then((comps) => {
                            res.status(200).send(comps);
                        })
                        .catch(error => {
                            console.log("MongoDB error", error)
                            res.status(404).send({"404": `Could not find companions for doctor with id "${req.params.id}`});
                            return;
                        });
                } else {
                    res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
                    return;
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
                return;
            });
    });
    
router.route("/doctors/:id/goodparent")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/goodparent`);

        Doctor.findOne({"_id": req.params.id})
            .then((doc) => {
                if (doc) {
                    Companion.find({$and: [{"doctors": req.params.id, "alive": false}]})
                        .then((comps) => {
                            if (comps) {
                                if(comps.length > 0) {
                                    res.status(200).send(false)
                                } else {
                                    res.status(200).send(true);
                                }
                            } else {
                                res.status(404).send({"404": `Could not find companions for doctor with id "${req.params.id}`});
                                return;
                            }
                        })
                        .catch(error => {
                            console.log("MongoDB error", error)
                            res.status(404).send({"404": `Could not find companions for doctor with id "${req.params.id}`});
                            return;
                        });
                } else {
                    res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
                    return;
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find doctor with id "${req.params.id}`});
                return;
            });
    });

// optional:
router.route("/doctors/favorites/:doctor_id")
    .delete((req, res) => {
        console.log(`DELETE /doctors/favorites/${req.params.doctor_id}`);

        FavoriteDoctor.findOneAndDelete({ doctor: req.params.doctor_id })
        .then(() => {
               res.status(200).send();
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(400).send({"400": `Could not delete doctor from favorites id "${req.params.id}`});
            return;
        });
    });

router.route("/companions")
    .get((req, res) => {
        console.log("GET /companions");
        // already implemented:
        Companion.find({})
            .sort('ordering') 
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
                return;
            });
    })
    .post((req, res) => {
        console.log("POST /companions");

        if (req.body._id) {
            res.status(500).send({"500": `Cannot change manually set id for companion"${req.params.id}`});
            return;
        }
        
        Companion.create(req.body).save()
        .then(comp => {
            res.status(201).send(comp);
        })
        .catch(error => {
          console.log("MongoDB error", error)
          res.status(500).send({"500": "Could not create companion."});
          return;
        });
    });

router.route("/companions/crossover")
    .get((req, res) => {
        console.log(`GET /companions/crossover`);
        

        Companion.find({$and : [ {"doctors": {$exists: true}}, {"doctors" : {$not: {$size: 1}}}, {"doctors": {$not: {$size: 0}}}]})
            .then((comps) => {
                if (comps) {
                    res.status(200).send(comps);
                } else {
                    res.status(404).send("404: Could not find any companions who travelled with multiple doctors");
                    return;
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find companions for doctor with id "${req.params.id}`});
                return;
            });
    });

// optional:
router.route("/companions/favorites")
    .get((req, res) => {
        console.log(`GET /companions/favorites`);

        FavoriteCompanion.find({})
        .then(data => {
            res.status(200).send(data);
        })
        .catch(err => {
            res.status(500).send(err);
        });
    })
    .post((req, res) => {
        console.log(`POST /companions/favorites`);

        Companion.findOne({"_id": req.body.id})
        .then((comp) => {
            FavoriteCompanion.findOne({"companion": req.body.id})
            .then((found) => {
                if (found) {
                    res.status(500).send({"500": "Companion already exists on favorite list."});
                    return;
                } else {
                    FavoriteCompanion.create(req.body.id).save()
                    .then(() => {
                        res.status(201).send(comp);
                    })
                    .catch(error => {
                      console.log("MongoDB error", error)
                      res.status(500).send({"500": "Could not create favorite companion."});
                      return;
                    });
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find companion with id in favorites list"${req.params.id}`});
                return;
            });    
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(404).send({"404": `Could not find companion with id "${req.params.id}`});
            return;
        });
    })

router.route("/companions/:id")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}`);

        const id = req.params.id
        Companion.findOne({"_id": id})
            .then(comp => {
                res.status(200).send(comp);
            }) 
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find companion with id "${req.params.id}`});
                return;
            });
    })
    .patch((req, res) => {
        console.log(`PATCH /companions/${req.params.id}`);
        
        if (req.body._id) {
            res.status(404).send({"404": `Cannot change database id for companion"${req.params.id}`});
            return;
        }
        
        Companion.findOneAndUpdate(
            {_id: req.params.id}, 
            req.body,
            { new: true } // means you want to return the updated doctor
        )
        .then((comp) => {
               res.status(200).send(comp);
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(404).send({"404": `Could not update companion with id "${req.params.id}`});
            return;
        });
    })
    .delete((req, res) => {
        console.log(`DELETE /companions/${req.params.id}`);
        
        Companion.findOneAndDelete({ _id: req.params.id })
        .then(() => {
               res.status(200).send();
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(404).send({"404": `Could not delete companion with id "${req.params.id}`});
            return;
        });
    });

router.route("/companions/:id/doctors")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/doctors`);

        Companion.findOne({"_id": req.params.id})
            .then((companion) => {
                if (companion) {
                    Doctor.find({"_id": {$in: companion.doctors}})
                        .then((docs) => {
                            res.status(200).send(docs);
                        })
                        .catch(error => {
                            console.log("MongoDB error", error)
                            res.status(404).send({"404": `Could not find doctors for companion with id "${req.params.id}`});
                            reject();
                            return;
                        });
                } else {
                    res.status(404).send({"404": `Could not find companion with id "${req.params.id}`});
                    return;
                }
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find companion with id "${req.params.id}`});
                return;
            });
    });


router.route("/companions/:id/friends")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/friends`);
        
        Companion.findOne({"_id": req.params.id})
            .then((companion) => {
                Companion.find({"seasons": {$in: companion.seasons}, "_id": {$ne: req.params.id}})
                    .then((companions) => {
                        if (companions) {
                            res.status(200).send(companions)
                        } else {
                            res.status(404).send({"404": `Could not find doctors for companion with id "${req.params.id}`});
                            return;
                        }
                    })
                    .catch(error => {
                        console.log("MongoDB error", error)
                        res.status(404).send({"404": `Could not find friends of companion with id "${req.params.id}`});
                        return;
                    });
            })
            .catch(error => {
                console.log("MongoDB error", error)
                res.status(404).send({"404": `Could not find companion with id "${req.params.id}`});
                return;
            });
    });

// optional:
router.route("/companions/favorites/:companion_id")
    .delete((req, res) => {
        console.log(`DELETE /companions/favorites/${req.params.companion_id}`);
        
        FavoriteCompanion.findOneAndDelete({ companion: req.params.companion_id })
        .then(() => {
               res.status(200).send();
        }) 
        .catch(error => {
            console.log("MongoDB error", error)
            res.status(400).send({"400": `Could not delete doctor from favorites id "${req.params.id}`});
            return;
        });
    });

module.exports = router;