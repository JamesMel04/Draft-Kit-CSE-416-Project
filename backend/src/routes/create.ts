// import { Router, Request, Response } from 'express';
// const bcrypt=require('bcrypt');
// const router=Router();
// router.get('/', async (req: Request, res: Response) => {
//   const user = req.query;
//   console.log(req.query);
//   const pass=bcrypt.hash(user.pass,10, async function(err:Error,hash:String){
//         if(err){
//             //probably do something here to notify user of error, return a value checked for in the jsx or smth
//             console.error(err);
//             res.status(500).json({error:err.message});
//         }
//         try {
//         //IMPLEMENT SQL CODE HERE
//         res.status(200);
//         } catch (error) {
//         res.status(500).json({ error: 'Failed to save account' });
//         }
//     });
  
// });

// export default router;