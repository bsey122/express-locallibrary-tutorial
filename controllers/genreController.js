const Genre = require("../models/genre");
const Book = require("../models/book");
const async = require("async");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = (req, res, next) => {
  Genre.find()
    .sort({ name: 1 })
    .exec(function (err, list_genres) {
      if (err) {
        return next(err);
      }
      res.render("layout", {
        title: "Genre List",
        genre_list: list_genres,
        content: "genre_list",
      });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },

      genre_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre == null) {
        // No results.
        const err = new Error("Genre not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render
      res.render("layout", {
        title: "Genre Detail",
        genre: results.genre,
        genre_books: results.genre_books,
        content: "genre_detail",
      });
    }
  );
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
  res.render("layout", { title: "Create Genre", content: "genre_form" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("layout", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
        content: "genre_form",
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
        if (err) {
          return next(err);
        }

        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        } else {
          genre.save((err) => {
            if (err) {
              return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.params.id).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.params.id }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      if (results.genre === null) {
        // No results
        res.redirect("/catalog/genres");
      }
      // Successful, so render
      res.render("layout", {
        title: "Delete Genre",
        genre: results.genre,
        genre_books: results.genres_books,
        content: "genre_delete",
      });
    }
  );
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
  async.parallel(
    {
      genre(callback) {
        Genre.findById(req.body.genreid).exec(callback);
      },
      genres_books(callback) {
        Book.find({ genre: req.body.genreid }).exec(callback);
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // Success
      if (results.genres_books.length) {
        // Genre has books. Render in the same way as for GET route
        res.render("layout", {
          title: "Delete Genre",
          genre: results.genre,
          genre_books: results.genres_books,
          content: "genre_delete",
        });
        return;
      }
      // Genre has no books. Delete object and redirect to the list of genres
      Genre.findByIdAndRemove(req.body.genreid, (err) => {
        if (err) {
          return next(err);
        }
        // Success - go to genre list
        res.redirect("/catalog/genres");
      });
    }
  );
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) => {
  Genre.findById(req.params.id).exec((err, genre) => {
    if (err) {
      return next(err);
    }
    if (genre === null) {
      // No results
      const err = new Error("Genre not found");
      err.status = 404;
      return next(err);
    }
    // Success
    res.render("layout", {
      title: "Update Genre",
      genre,
      content: "genre_form",
    });
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize fields
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    // Extract the validation errors from request
    const errors = validationResult(req);

    // Create a Genre object with escaped/trimmed data and old id
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages

      res.render("layout", {
        title: "Update Genre",
        genre,
        content: "genre_form",
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record
    Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
      if (err) {
        return next(err);
      }
      // Success: redirect to the genre detail page
      res.redirect(thegenre.url);
    });
  },
];
