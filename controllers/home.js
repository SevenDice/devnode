/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('home', {
    title: 'Home'
  });
};

exports.getDashboard = (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard'
  });
};

