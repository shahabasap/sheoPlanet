

const adminRootpage = (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect('/admin/adminhome')
    }
    else {
      next();
    }


  } catch (error) {
    console.log(error.message);
  }
}
const adminSessionControll = (req, res, next) => {
  try {
    if (req.session.admin) {
      next();

    }
    else {
      res.redirect('/admin')

    }


  } catch (error) {
    console.log(error.message);
  }
}
module.exports = {
  adminRootpage,
  adminSessionControll
}