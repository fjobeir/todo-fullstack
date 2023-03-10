const response = require("../../helper/responses");
const services = require("../services");
const auth_services = require("../../auth services")
const transformers = require("../../transformers");

const register = async (req, res, next) => {
  try {
    const { username, password, email, passwordConfirmation } = req.body;
    if (username?.length < 3)
      return response.failedWithMessage(
        "name is must be more than 3 chars",
        res
      );
    if (
      !String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    )
      return response.failedWithMessage("email is invalid", res);

    if (password?.length < 6)
      return response.failedWithMessage("password is invalid", res);

    if (password.localeCompare(passwordConfirmation))
      return response.failedWithMessage("password dose not match !", res);

    const user = await services.createUser({ username, email, password });
    if (!user)
      return response.failedWithMessage("this user already exist !", res);
    return response.successWithMessage("account created successfully", res);
  } catch (err) {
    console.log("ERROR--> ", err);
    return response.serverError(res);
  }
};

const login = async (req, res, next) => {
  try {
    const { account, password } = req.body;
    
    if (!account || !password)
      return response.failedWithMessage(
        "please fill the account and password !",
        res
      );
    const user = await services.findUser({ account, password });
    if (!user)
      return response.failedWithMessage(
        "user not found please create an account",
        res
      );
    if(!auth_services.checkPassword(password, user?.password))  
    return response.failedWithMessage(
        "please check your password",
        res
      );
      const transformeredUser = transformers.userTransformer(user);
      const token = auth_services.tokenGenerator(transformeredUser)
      res.cookie("token", token)
    return response.successWithMessage("logged successfully", res, {
        user: transformeredUser,
        token
    });
  } catch (err) {
    console.log("ERROR--> ", err);
    return response.serverError(res);
  }
};

const index = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await services.getUser({userId})
    console.log(user)
    if(!user) return response.failedWithMessage("failed to get info", res)
    return response.successWithMessage("user info got successfully", res, {user: transformers.userTransformer(user),
    task: transformers.todoesTransformer(user.Tasks)})
  } catch(err) {

  }
}

const destroy = async (req, res, next) =>{
  try {
   const email = req.user.email
  const user = await services.findUser({account: email})
     if(user){
       user.destroy()
       return response.successWithMessage("Account deleted successfully", res)
     }else{
       response.failedWithMessage("User not found", res)
     }
  }catch(err){
   console.log("ERROR--> ", err);
   return response.serverError(res);
  }
 }

 const update = async (req, res, next) => {
  try {
    const username = req?.body?.username.trim();
    const email = req?.body?.email?.trim();
    const currentPassword = req?.body?.currentPassword?.trim();
    const newPassword = req?.body?.newPassword?.trim();
    const userId = req?.user?.id;

    if (username?.length < 3)
      return response.failedWithMessage(
        "name is must be more than 3 chars",
        res
      );
    if (
      !String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        )
    )
      return response.failedWithMessage("email is invalid", res);
    if (currentPassword?.length < 6)
      return response.failedWithMessage(
        "password must be at least 6 chat's",
        res
      );

    let password = null;
    if (!newPassword) {
      password = currentPassword;
    } else if (newPassword?.length < 6) {
      return response.failedWithMessage(
        "password must be at least 6 char's",
        res
      );
    } else if (newPassword?.length) {
      {
        password = newPassword;
      }
      password;
    }

    const user = await services.updateUser({
      username,
      email,
      password,
      userId,
    });
    if (user)return response.successWithMessage("your account has been updated successfully",res);
  } catch (err) {
    console.log("ERROR--> ", err);
    return response.serverError(res);
  }
};

const logOut = (req, res, next) =>{
  try {
    res.cookie("jwt", "", { expires: new Date(0) });
    const decodeToken = auth_services.decodeToken(req.user.token)
    delete decodeToken["iat"]
    delete decodeToken["exp"]
    const codedToken = auth_services.tokenGenerator(decodeToken, "0h")
    return response.successWithMessage("Logged out", res, codedToken);
  
  } catch (err){
    console.log("ERROR--> ", err);
    return response.serverError(res);
  }
}

const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id
    const user = await services.getUser({userId})
    if(!user) return response.failedWithMessage("failed to get user infon", res)
    return response.successWithMessage("the User found successfully ",res, {user: transformers.userTransformer(user), 
      tasks: transformers.todoesTransformer(user.Tasks)})
  } catch (err){
    console.log("ERROR--> ", err);
    return response.serverError(res);
  }
}


module.exports = {
  register,
  login,
  index,
  destroy, 
  update,
  logOut,
  getUser
};
