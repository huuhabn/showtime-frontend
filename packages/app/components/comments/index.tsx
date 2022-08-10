import { useCallback, useMemo, useRef } from "react";
import { FlatList as RNFlatList, Platform, StyleSheet } from "react-native";

import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { ListRenderItemInfo } from "@shopify/flash-list";

import { useAlert } from "@showtime-xyz/universal.alert";
import { ModalFooter } from "@showtime-xyz/universal.modal";
import { useSafeAreaInsets } from "@showtime-xyz/universal.safe-area";
import { View } from "@showtime-xyz/universal.view";

import { CommentRow } from "app/components/comments/comment-row";
import { CommentType, useComments } from "app/hooks/api/use-comments";
import { useModalListProps } from "app/hooks/use-modal-list-props";
import { useUser } from "app/hooks/use-user";
import { InfiniteScrollList } from "app/lib/infinite-scroll-list";
import type { NFT } from "app/types";

import { EmptyPlaceholder } from "../empty-placeholder";
import { CommentInputBox, CommentInputBoxMethods } from "./comment-input-box";
import { CommentsContainer } from "./comments-container";
import { CommentsStatus } from "./comments-status";

const keyExtractor = (item: CommentType) => `comment-${item.comment_id}`;

const FlatList = Platform.OS === "android" ? BottomSheetFlatList : RNFlatList;

export function Comments({ nft }: { nft: NFT }) {
  //#region refs
  const Alert = useAlert();
  const inputRef = useRef<CommentInputBoxMethods>(null);
  //#endregion

  //#region hooks
  const { isAuthenticated } = useUser();
  const {
    data,
    error,
    isSubmitting,
    isLoading,
    likeComment,
    unlikeComment,
    deleteComment,
    newComment,
  } = useComments(nft.nft_id);
  const modalListProps = useModalListProps();
  const { bottom } = useSafeAreaInsets();
  //#endregion

  //#region variables
  const dataReversed = useMemo(
    () => data?.comments.slice().reverse() || [],
    [data]
  );
  //#endregion

  //#region callbacks
  const handleOnDeleteComment = useCallback(
    async function handleOnDeleteComment(commentId: number) {
      const _deleteComment = async () => {
        try {
          await deleteComment(commentId);
        } catch (error) {
          Alert.alert("Error", "Cannot delete comment.", [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Try Again",
              style: "destructive",
              onPress: _deleteComment,
            },
          ]);
        }
      };

      Alert.alert(
        "Delete Comment",
        "Are you sure you want to delete this comment?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: _deleteComment,
          },
        ]
      );
    },
    [Alert, deleteComment]
  );
  const handleOnReply = useCallback((comment: CommentType) => {
    inputRef.current?.reply(comment);
  }, []);
  //#endregion

  //#region rendering
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CommentType>) => (
      <CommentRow
        key={`comment-row-${item.comment_id}`}
        comment={item}
        likeComment={likeComment}
        unlikeComment={unlikeComment}
        deleteComment={handleOnDeleteComment}
        reply={handleOnReply}
      />
    ),
    [likeComment, unlikeComment, handleOnDeleteComment, handleOnReply]
  );

  const listEmptyComponent = useCallback(
    () => (
      <EmptyPlaceholder
        text="Be the first to add a comment!"
        title="💬 No comments yet..."
        tw="flex-1 items-center justify-center"
      />
    ),
    []
  );

  return (
    <CommentsContainer style={styles.container}>
      {isLoading || (dataReversed.length == 0 && error) ? (
        <CommentsStatus isLoading={isLoading} error={error} />
      ) : (
        <>
          <InfiniteScrollList
            data={dataReversed}
            refreshing={isLoading}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            estimatedItemSize={98}
            overscan={98}
            keyboardDismissMode="on-drag"
            ListEmptyComponent={listEmptyComponent}
            ListFooterComponent={
              <View style={{ height: Math.max(bottom, 20) }} />
            }
            {...modalListProps}
          />
          {isAuthenticated && (
            <ModalFooter>
              <CommentInputBox
                ref={inputRef}
                submitting={isSubmitting}
                submit={newComment}
              />
            </ModalFooter>
          )}
        </>
      )}
    </CommentsContainer>
  );
  //#endregion
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
