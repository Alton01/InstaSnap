
import { ID, Query } from "appwrite";
import { INewPost, INewUser, IUpdatePost, IUpdateUser } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";


//API FOR CREATING USER ACCOUNT ON AUTH IN APPWRITE.
export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: avatarUrl
        })

        return newUser;
    } catch (error) {
        console.log(error);
        return error;
    }

}


//API FOR SAVING USER TO APPWRITE DATABASE
export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: URL;
    username?: string;
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user,
        )

        return newUser;
    } catch (error) {
        console.log(error)
    }
}


// API FUNCTION FOR SIGNING IN USER AND CREATING SESSION
export async function signInAccount(user: {email: string; password: string;}) {
    try {
        const session = await account.createEmailSession(user.email, user.password)

        return session;
    } catch (error) {
       console.log(error) 
    }
}


//API FUNCTION FOR GETTING CURRENT USER
export async function getCurrentUser() {
    try {
       const currentAccount = await account.get();
       
       if (!currentAccount) throw Error;

       const currentUser = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('accountId', currentAccount.$id)]
       )

       if(!currentUser) throw Error;

       return currentUser.documents[0];
    } catch (error) {
        console.log(error)  
    }
}

//FUNCTION FOR LOGGING OUT A USER
export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current");

        return session;
    } catch (error) {
        console.log(error)
    }
};


////////////////////////////////////POSTS///////////////////////////////////////////////

//FOR CREATING A NEW  POST 
export async function createPost(post: INewPost) {
    try {
        //upload image to appwrite storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error;

        //Get file url
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
            deleteFile(uploadedFile.$id)
            throw Error
        }

        //convert tags into an array
        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        //save post to database
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        )
        if (!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error;
        }

        return newPost;
        
    } catch (error) {
        console.log(error)
    }
}

// FUNCTION FOR UPLOADING FILES
export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );
        return uploadedFile;
    } catch (error) {
        console.log(error)
    }
}

//FUNCTIOON FOR GETTING FILE PREVIEW AFTER UPLOAD
export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            "top",
            100,
        )
        return fileUrl;
    } catch (error) {
        console.log(error)
    }

}

//FUNCTION FOR DELETING FIILE IF THERE IS AN UPLOAD ERROR WHICH DIDNT CREATE FILEURL

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId);

        return { status: 'ok'}
    } catch (error) {
        console.log(error)
    }
}

//FUNCTION FOR GETTING RECENT POSTS
export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)]
    )

    if (!posts) throw Error;

    return posts;
}


//FOR LIKING A POST
export async function likePost(postId: string, likeArray: string[]) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes: likeArray
            }
        )

        if (!updatedPost) throw Error;

        return updatedPost
        } catch (error) {
        console.log(error)
    }
}



//FOR SAVING A POST
export async function SavePost(postId: string, userId: string) {
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId,
            }
        )

        if (!updatedPost) throw Error;

        return updatedPost
        } catch (error) {
        console.log(error)
    }
}


//FOR DELETING A SAVED POST FROM A USER'S SAVES
export async function deleteSavedPost(savedRecordId: string) {
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            savedRecordId,
        )

        if (!statusCode) throw Error;

        return { status: 'ok'}
        } catch (error) {
        console.log(error)
    }
}

// FOR GETTING A POST BY ITS ID
export async function getPostById(postId: string) {
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )

        return post;
    } catch (error) {
        console.log(error)
    }
}

//FOR UPDATING A POST 
export async function updatePost(post: IUpdatePost) {

    const hasFileToUpdate = post.file.length > 0;

    try {

        let image = {
            imageUrl: post.imageUrl,
            imageId: post.imageId
        }

        if(hasFileToUpdate) {
              //upload image to appwrite storage
        const uploadedFile = await uploadFile(post.file[0]);

        if (!uploadedFile) throw Error;

         //Get file url
         const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
             deleteFile(uploadedFile.$id)
            throw Error
        }

        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id }
        }

      

        //convert tags into an array
        const tags = post.tags?.replace(/ /g,'').split(',') || [];

        //save post to database
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            post.postId,
            {
                caption: post.caption,
                imageUrl: image.imageUrl,
                imageId: image.imageId,
                location: post.location,
                tags: tags
            }
        )
        if (!updatedPost) {
            await deleteFile(post.imageId)
            throw Error;
        }

        return updatedPost;
        
    } catch (error) {
        console.log(error)
    }
}


//FOR DELETING A POST
export async function deletePost(postId: string, imageId: string) {
    if(!postId || !imageId) throw Error;

    try {
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )

        return { status: 'ok'}
    } catch (error) {
        console.log(error)
    }
}

//FOR GETTING INFINITE POSTS
export async function getInfinitePosts({ pageParam }: {pageParam: number}) {
    const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(20)]

    if (pageParam) {
        queries.push(Query.cursorAfter(pageParam.toString()));
    }

    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            queries
        )

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error)
    }
}

//FOR SEARCHING POSTS
export async function searchPosts(searchTerm: string) {
  
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.search('caption', searchTerm)]
        )

        if (!posts) throw Error;

        return posts;
    } catch (error) {
        console.log(error)
    }
}

// ============================== GET USERS
export async function getUsers(limit?: number) {
    const queries: any[] = [Query.orderDesc("$createdAt")];
  
    if (limit) {
      queries.push(Query.limit(limit));
    }
  
    try {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        queries
      );
  
      if (!users) throw Error;
  
      return users;
    } catch (error) {
      console.log(error);
    }
  }
  
  // ============================== GET USER BY ID
  export async function getUserById(userId: string) {
    try {
      const user = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId
      );
  
      if (!user) throw Error;
  
      return user;
    } catch (error) {
      console.log(error);
    }
  }
  
  // ============================== UPDATE USER
  export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;
    try {
      let image = {
        imageUrl: user.imageUrl,
        imageId: user.imageId,
      };
  
      if (hasFileToUpdate) {
        // Upload new file to appwrite storage
        const uploadedFile = await uploadFile(user.file[0]);
        if (!uploadedFile) throw Error;
  
        // Get new file url
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
          await deleteFile(uploadedFile.$id);
          throw Error;
        }
  
        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
      }
  
      //  Update user
      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        user.userId,
        {
          name: user.name,
          bio: user.bio,
          imageUrl: image.imageUrl,
          imageId: image.imageId,
        }
      );
  
      // Failed to update
      if (!updatedUser) {
        // Delete new file that has been recently uploaded
        if (hasFileToUpdate) {
          await deleteFile(image.imageId);
        }
        // If no new file uploaded, just throw error
        throw Error;
      }
  
      // Safely delete old file after successful update
      if (user.imageId && hasFileToUpdate) {
        await deleteFile(user.imageId);
      }
  
      return updatedUser;
    } catch (error) {
      console.log(error);
    }
  }