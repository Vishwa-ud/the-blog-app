import ReactMarkdown from "react-markdown";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Dispatch, SetStateAction, useState } from "react";
import remarkGfm from "remark-gfm";
import SafeText from "../../../components/Security/SafeText";
import { useDeletePostMutation } from "../api/deletePost";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

interface IRenderedPostProps extends Partial<IPost> {
    isEdit?: boolean;
    setIsEdit?: Dispatch<SetStateAction<boolean>>;
    isEditAllowed?: boolean;
}

const RenderedPost = (props: IRenderedPostProps) => {
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const { mutate: deletePost, isLoading: isDeleting } = useDeletePostMutation();

    const handleDeleteClick = () => {
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        if (props.id) {
            deletePost(props.id);
        }
        setOpenDeleteDialog(false);
    };

    const handleDeleteCancel = () => {
        setOpenDeleteDialog(false);
    };

    return (
        <Box sx={{ mt: 2 }}>
            {props.postImg && (
                <Box
                    component="img"
                    src={props.postImg as string}
                    alt="Post image"
                    sx={{
                        display: "flex",
                        width: "auto",
                        maxWidth: "100%",
                        objectFit: "cover",
                        height: "400px",
                        borderRadius: "10px",
                        marginX: "auto",
                    }}
                />
            )}
            <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                py={3}
            >
                <SafeText
                    variant="h1"
                    sx={{
                        fontWeight: "600",
                    }}
                >
                    {props.title}
                </SafeText>
                {props?.isEditAllowed && !props?.isEdit && (
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="text"
                            endIcon={<EditIcon />}
                            size="medium"
                            color="primary"
                            sx={{
                                width: "fit-content",
                            }}
                            onClick={() =>
                                props.setIsEdit
                                    ? props.setIsEdit((prevState) => !prevState)
                                    : null
                            }
                        >
                            Edit
                        </Button>
                        <Button
                            variant="text"
                            endIcon={<DeleteIcon />}
                            size="medium"
                            color="error"
                            sx={{
                                width: "fit-content",
                            }}
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                        >
                            Delete
                        </Button>
                    </Stack>
                )}
            </Stack>
            <SafeText
                variant="body1"
                sx={{
                    fontWeight: "500",
                    fontStyle: "italic",
                    pb: 3,
                }}
            >
                {props.preview}
            </SafeText>
            <ReactMarkdown
                components={{
                    p: ({ node, ...props }) => (
                        <Typography
                            variant="body1"
                            {...props}
                            sx={{ fontSize: "1.15em", py: 0.5 }}
                        />
                    ),
                }}
                remarkPlugins={[remarkGfm]}
            >
                {props.content || ""}
            </ReactMarkdown>
            
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Delete Post
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete this post? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RenderedPost;
