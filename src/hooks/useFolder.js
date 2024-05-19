import { useReducer, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { database } from "../firebase";
import { doc, getDoc, query, where, orderBy, onSnapshot } from "firebase/firestore";

const ACTIONS = {
  SELECT_FOLDER: "select-folder",
  UPDATE_FOLDER: "update-folder",
  SET_CHILD_FOLDERS: "set-child-folders",
  SET_CHILD_FILES: "set-child-files",
  SET_LOADING: "set-loading",
};

export const ROOT_FOLDER = { name: "Root", id: null, path: [] };

function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.SELECT_FOLDER:
      return {
        ...state,
        folderId: payload.folderId,
        folder: payload.folder || ROOT_FOLDER,
        childFiles: [],
        childFolders: [],
      };
    case ACTIONS.UPDATE_FOLDER:
      return {
        ...state,
        folder: payload.folder || ROOT_FOLDER,
        loading: false,
      };
    case ACTIONS.SET_CHILD_FOLDERS:
      return {
        ...state,
        childFolders: payload.childFolders,
        loading: false,
      };
    case ACTIONS.SET_CHILD_FILES:
      return {
        ...state,
        childFiles: payload.childFiles,
        loading: false,
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: true,
      };
    default:
      return state;
  }
}

export function useFolder(folderId = null, folder = null) {
  const [state, dispatch] = useReducer(reducer, {
    folderId,
    folder: folder || ROOT_FOLDER,
    childFolders: [],
    childFiles: [],
    loading: true,
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    console.log("Selecting folder:", folderId, folder);
    dispatch({ type: ACTIONS.SELECT_FOLDER, payload: { folderId, folder } });
  }, [folderId, folder]);

  useEffect(() => {
    console.log("useEffect for folder update called with folderId:", folderId);
    if (folderId == null) {
      console.log("Updating to ROOT_FOLDER");
      return dispatch({
        type: ACTIONS.UPDATE_FOLDER,
        payload: { folder: ROOT_FOLDER },
      });
    }

    const folderRef = doc(database.folders, folderId);
    dispatch({ type: ACTIONS.SET_LOADING });
    getDoc(folderRef)
      .then((doc) => {
        if (doc.exists()) {
          console.log("Fetched folder:", doc.data());
          dispatch({
            type: ACTIONS.UPDATE_FOLDER,
            payload: { folder: database.formatDoc(doc) },
          });
        } else {
          console.log("Folder does not exist, updating to ROOT_FOLDER");
          dispatch({
            type: ACTIONS.UPDATE_FOLDER,
            payload: { folder: ROOT_FOLDER },
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching folder:", error);
        dispatch({
          type: ACTIONS.UPDATE_FOLDER,
          payload: { folder: ROOT_FOLDER },
        });
      });
  }, [folderId]);

  useEffect(() => {
    if (currentUser == null) {
      console.log("useEffect for child folders - currentUser is null, returning early");
      return;
    }
    console.log("Querying child folders for folderId:", folderId, "and userId:", currentUser.uid);

    const q = folderId == null 
      ? query(
          database.folders,
          where("parentId", "==", null),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt")
        )
      : query(
          database.folders,
          where("parentId", "==", folderId),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt")
        );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const folders = snapshot.docs.map(database.formatDoc);
      console.log("Fetched child folders:", folders);
      dispatch({
        type: ACTIONS.SET_CHILD_FOLDERS,
        payload: { childFolders: folders },
      });
    });

    return unsubscribe;
  }, [folderId, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      console.log("useEffect for child files - currentUser is null, returning early");
      return;
    }
    console.log("Querying child files for folderId:", folderId, "and userId:", currentUser.uid);

    const q = query(
      database.files,
      where("folderId", "==", folderId),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const files = snapshot.docs.map(database.formatDoc);
      console.log("Fetched child files:", files);
      dispatch({
        type: ACTIONS.SET_CHILD_FILES,
        payload: { childFiles: files },
      });
    });

    return unsubscribe;
  }, [folderId, currentUser]);

  return state;
}
