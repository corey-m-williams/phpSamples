# PHP Samples

A set of code samples in php, mostly working with drupal.

This code has mostly been anonymized, and so will most likely not work with a blank Drupal install, as it is missing modules from the project it is from.

## Gigya

Integration module for the Gigya social media aggregation service

## Pushupdate

Module to save a Drupal block (section of a site) to file, with a node.js server watching for changes to the file.
Upon a change being seen, the server sends out the updated section of the site through socket.io, which then updates the page with the new content.

This was made to have faster updates on a site with a 15 minute static cache
