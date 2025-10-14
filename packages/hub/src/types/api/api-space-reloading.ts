/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface ApiCreateReloadRequest {
  filepath: string;
  contentsPrev: string;
  contentsNew: string;
}
export interface ApiCreateReloadResponse {
  res: ApiCreateReloadResponseError | ApiCreateReloadResponseSuccess;
}
export interface ApiCreateReloadResponseError {
  status: "alreadyReloading" | "fileNotFound" | "contentsMismatch";
}
export interface ApiCreateReloadResponseSuccess {
  status: "created";
  reloadId: string;
}
export interface ApiFetchContentsRequest {
  filepath: string;
}
export interface ApiFetchContentsResponse {
  res: ApiFetchContentsResponseError | ApiFetchContentsResponseSuccess;
}
export interface ApiFetchContentsResponseError {
  status: "fileNotFound";
}
export interface ApiFetchContentsResponseSuccess {
  status: "ok";
  contents: string;
}
export interface ApiGetReloadEventSourceData {
  data:
    | ReloadOperationError
    | ReloadOperationException
    | ReloadOperationObject
    | ReloadOperationRun
    | ReloadOperationUI;
}
export interface ReloadOperationError {
  kind: "error";
  traceback: string;
}
export interface ReloadOperationException {
  kind: "exception";
  region: ReloadRegion;
  traceback: string;
}
export interface ReloadRegion {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
}
export interface ReloadOperationObject {
  kind: "add" | "update" | "delete";
  region: ReloadRegion;
  objectType: string;
  objectName: string;
}
export interface ReloadOperationRun {
  kind: "run";
  region: ReloadRegion;
  codeLines: string;
  stdout: string | null;
  stderr: string | null;
}
export interface ReloadOperationUI {
  kind: "ui";
  updated: boolean;
}
export interface ApiGetReloadRequest {
  reloadId: string;
}
export interface ApiGetStatusRequest {
  revision: string;
}
export interface ApiGetStatusResponse {
  reloading: boolean;
  uncommited: string[];
}
