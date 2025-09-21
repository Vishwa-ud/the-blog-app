import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../app/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const deletePost = async (postId: string): Promise<IPost> => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
};

export const useDeletePostMutation = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (postId: string) => deletePost(postId),
        onMutate: async (postId) => {
            // Cancel any outgoing refetches to avoid overwriting our optimistic update
            await queryClient.cancelQueries(["posts"]);
            await queryClient.cancelQueries(["posts", "single", postId]);

            // Snapshot the previous values
            const previousAllPosts = queryClient.getQueryData<{
                pages: { posts: IPost[] }[];
            }>(["posts", "all"]);

            // Optimistically remove the post from all posts cache
            if (previousAllPosts) {
                queryClient.setQueryData<{ pages: { posts: IPost[] }[] }>(
                    ["posts", "all"],
                    (oldData) => {
                        if (!oldData) return oldData;
                        
                        const updatedPages = oldData.pages.map((page) => ({
                            ...page,
                            posts: page.posts.filter((post) => post.id !== postId)
                        }));

                        return { ...oldData, pages: updatedPages };
                    }
                );
            }

            return { previousAllPosts };
        },
        onError: (_err, _postId, context) => {
            // If the mutation fails, restore the previous data
            if (context?.previousAllPosts) {
                queryClient.setQueryData<{ pages: { posts: IPost[] }[] }>(
                    ["posts", "all"],
                    context.previousAllPosts
                );
            }
            toast.error("Failed to delete post");
        },
        onSuccess: () => {
            toast.success("Post has been successfully deleted");
            // Navigate back to home page after successful deletion
            navigate("/");
        },
        onSettled: (deletedPost) => {
            // Always refetch to make sure we have accurate data
            queryClient.invalidateQueries(["posts"]);
            if (deletedPost) {
                queryClient.removeQueries(["posts", "single", deletedPost.id]);
                queryClient.invalidateQueries(["posts", deletedPost.authorId]);
            }
        },
    });
};
