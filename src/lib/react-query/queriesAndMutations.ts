import {
    useQuery,
    useMutation,
    useQueryClient,
    useInfiniteQuery
} from '@tanstack/react-query'
import { SavePost, updatePost, createPost, createUserAccount, deletePost, deleteSavedPost, getCurrentUser, getPostById, getRecentPosts, likePost, signInAccount, signOutAccount, getInfinitePosts, searchPosts } from '../appwrite/api'
import { INewPost, INewUser, IUpdatePost } from '@/types'
import { QUERY_KEYS } from './queryKeys'



//FOR CREATING USER
export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => createUserAccount(user),
    })
}


//FOR SIGNING IN TO ACCOUNT
export const useSignInAccount = () => {
    return useMutation({
        mutationFn: (user: {
            email: string; password: string;
        }) => signInAccount(user),
    })
}

//FOR SIGNING OUT OF ACCOUNT
export const useSignOutAccount = () => {
    return useMutation({
        mutationFn: signOutAccount
    })
}

// FOR CREATING POST
export const useCreatePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (post: INewPost) => createPost(post),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
        }
    })
}

// FOR GETTING RECENT POSTS

export const useGetRecentPosts = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
        queryFn: getRecentPosts,
    })
}


//FOR LIKING POSTS
export const useLikePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({postId, likesArray} : { postId: string; likesArray: string[]}) => 
            likePost(postId, likesArray),
            onSuccess: (data) => {
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_CURRENT_USER]
                })
            }
    })
}


//FOR SAVING POSTS
export const useSavePost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({postId, userId} : { postId: string; userId: string}) => 
            SavePost(postId, userId),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_CURRENT_USER]
                })
            }
    })
}


//FOR DELETING SAVING POSTS
export const useDeleteSavedPost = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
            onSuccess: () => {
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_POSTS]
                })
                queryClient.invalidateQueries({
                    queryKey: [QUERY_KEYS.GET_CURRENT_USER]
                })
            }
    })
}


//FOR GETTING CURRENT USER
export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        queryFn: getCurrentUser
    })
}

//FOR GETTING POST BY ID
export const useGetPostById = (postId: string) => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
        queryFn: () => getPostById(postId),
        enabled: !!postId
    })
}

// FOR UPDATING POST
export const useUpdatePost = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (post: IUpdatePost) => updatePost(post),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
            })
        }
    })
}


// FOR DELETING A POST
export const useDeletePost = () => {

    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, imageId}: { postId: string, imageId: string }) => deletePost(postId, imageId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
        }
    })
}

//FOR GETTING INFINITE POSTS
  
export const useGetPosts = () => {
   return useInfiniteQuery({
       queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
        queryFn: getInfinitePosts as any,
       getNextPageParam: (lastPage: any) => {
            if (lastPage && lastPage.documents.length === 0) { return null; }
           const lastId = lastPage.documents[lastPage.documents.length - 1].$id;

           return lastId
        }
    })
}


//FOR GETTING SEARCH POSTS THROUGH SEARCH STRINGS
export const useSearchPosts = (searchTerm: string) => {
    return useQuery({
        queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
        queryFn: () => searchPosts(searchTerm),
        enabled: !!searchTerm
    })
}

