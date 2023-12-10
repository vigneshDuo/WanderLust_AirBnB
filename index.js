const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const Review = require("./models/review.js");
const path = require("path");
const methodOverride = require('method-override')
const engine = require('ejs-mate');
const { hostname } = require("os");
const wrapAsync = require("./utils/wrapAsync.js")
const expressError = require("./utils/expressError.js")
const {listingValidate,reviewSchema} = require("./schemaValidation.js");
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(methodOverride('_method'))

const serverValidate = (req,res,next)=>{
    let {error} = listingValidate.validate(req.body);
    if(error){
        throw new expressError(400,error);
    }
    else{
        next();
    }
}

const validateReview = (req,res,next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
        throw new expressError(400,error);
    }
    else{
        next();
    }
}

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}


main().then(()=>{
    console.log("wanderlust database connection is successfull");
})


app.listen(port,()=>{
    console.log(`server is started with port number ${port}`);
})

app.get("/",wrapAsync(async(req,res)=>{
    let datas = await Listing.find();
    res.render("listing/index.ejs",{datas});
}));


app.get("/show/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    let data =await Listing.findById(id).populate("reviews");
    res.render("listing/show.ejs",{data});
}));

app.get("/listing/new",(req,res)=>{
    res.render("listing/new.ejs");
})

app.post("/listing", serverValidate ,wrapAsync(async(req,res,next)=>{
    let listing = new Listing(req.body.listing);
    await listing.save();
    res.redirect("/");
}))



app.get("/listing/edit/:id",wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let data =await Listing.findById(id);
    res.render("listing/edit.ejs",{data})
}));


//Reviews

app.post("/listings/:id/reviews",validateReview,wrapAsync(async (req,res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    res.redirect(`http://localhost:8080/show/${listing._id}`);
}));

app.put("/listing/edit/:id",wrapAsync(async(req,res)=>{
    if(!req.body.listing){
        throw new expressError(400,"Please add valid data!");
    }
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect("/");
}));


app.delete("/listing/delete/:id",wrapAsync(async (req,res)=>{
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    res.redirect("/");
}));

app.delete("/listing/:id/reviews/:reviewId",wrapAsync(async (req,res)=>{
    let{id,reviewId} = req.params;
    await Listing.findByIdAndUpdate(id,{$pull : {reviews:reviewId}});
    let result = await Review.findByIdAndDelete(reviewId);
    res.redirect(`http://localhost:8080/show/${id}`);
   
}));



app.get("*",(req,res,next)=>{
    next(new expressError(404,"Page Not Found!"));
})

app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something error has been occured"} = err;
    res.status(statusCode).render("error.ejs",{err});
})