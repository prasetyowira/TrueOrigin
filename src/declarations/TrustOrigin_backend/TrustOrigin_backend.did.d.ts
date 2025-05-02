import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ApiError = { 'InvalidInput' : { 'details' : ErrorDetails } } |
  { 'NotFound' : { 'details' : ErrorDetails } } |
  { 'ExternalApiError' : { 'details' : ErrorDetails } } |
  { 'Unauthorized' : { 'details' : ErrorDetails } } |
  { 'AlreadyExists' : { 'details' : ErrorDetails } } |
  { 'MalformedData' : { 'details' : ErrorDetails } } |
  { 'InternalError' : { 'details' : ErrorDetails } };
export interface ApiResponse_OrganizationResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_OrganizationsListResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationsListResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_ProductResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [ProductResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_ProductVerificationEnhancedResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [ProductVerificationEnhancedResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_RateLimitInfo {
  'metadata' : ResponseMetadata,
  'data' : [] | [RateLimitInfo],
  'error' : [] | [ApiError],
}
export interface ApiResponse_ResellerUniqueCodeResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResellerUniqueCodeResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_ResellerVerificationResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResellerVerificationResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_Text {
  'metadata' : ResponseMetadata,
  'data' : [] | [string],
  'error' : [] | [ApiError],
}
export interface ApiResponse_Unit {
  'metadata' : ResponseMetadata,
  'data' : [] | [null],
  'error' : [] | [ApiError],
}
export interface ApiResponse_UserResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [UserResponse],
  'error' : [] | [ApiError],
}
export interface CreateOrganizationRequest {
  'metadata' : Array<Metadata>,
  'name' : string,
  'description' : string,
}
export interface ErrorDetails {
  'message' : string,
  'details' : Array<Metadata>,
}
export interface FindOrganizationsRequest {
  'pagination' : [] | [PaginationRequest],
  'name' : string,
}
export interface GenerateResellerUniqueCodeRequest {
  'context' : [] | [string],
  'reseller_id' : Principal,
}
export interface Metadata { 'key' : string, 'value' : string }
export interface Organization {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'metadata' : Array<Metadata>,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
  'private_key' : string,
}
export interface OrganizationInput {
  'metadata' : Array<Metadata>,
  'name' : string,
  'description' : string,
}
export interface OrganizationPublic {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'metadata' : Array<Metadata>,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
}
export interface OrganizationResponse { 'organization' : OrganizationPublic }
export type OrganizationResult = { 'error' : ApiError } |
  { 'organization' : Organization };
export interface OrganizationsListResponse {
  'pagination' : [] | [PaginationResponse],
  'organizations' : Array<OrganizationPublic>,
}
export interface PaginationRequest {
  'page' : [] | [number],
  'limit' : [] | [number],
}
export interface PaginationResponse {
  'total' : bigint,
  'page' : number,
  'limit' : number,
  'has_more' : boolean,
}
export type PrivateKeyResult = { 'key' : string } |
  { 'error' : ApiError };
export interface Product {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'public_key' : string,
  'metadata' : Array<Metadata>,
  'name' : string,
  'org_id' : Principal,
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
  'category' : string,
}
export interface ProductInput {
  'metadata' : Array<Metadata>,
  'name' : string,
  'org_id' : Principal,
  'description' : string,
  'category' : string,
}
export interface ProductResponse { 'product' : Product }
export type ProductResult = { 'none' : null } |
  { 'error' : ApiError } |
  { 'product' : Product };
export interface ProductSerialNumber {
  'updated_at' : bigint,
  'updated_by' : Principal,
  'product_id' : Principal,
  'metadata' : Array<Metadata>,
  'created_at' : bigint,
  'created_by' : Principal,
  'print_version' : number,
  'user_serial_no' : string,
  'serial_no' : Principal,
}
export type ProductSerialNumberResult = { 'result' : ProductSerialNumber } |
  { 'error' : ApiError };
export type ProductUniqueCodeResult = {
    'result' : ProductUniqueCodeResultRecord
  } |
  { 'error' : ApiError };
export interface ProductUniqueCodeResultRecord {
  'product_id' : Principal,
  'created_at' : bigint,
  'print_version' : number,
  'unique_code' : string,
  'serial_no' : Principal,
}
export interface ProductVerification {
  'id' : Principal,
  'product_id' : Principal,
  'metadata' : Array<Metadata>,
  'created_at' : bigint,
  'created_by' : Principal,
  'print_version' : number,
  'serial_no' : Principal,
}
export interface ProductVerificationEnhancedResponse {
  'status' : ProductVerificationStatus,
  'expiration' : [] | [bigint],
  'rewards' : [] | [VerificationRewards],
  'verification' : [] | [ProductVerification],
}
export type ProductVerificationResult = {
    'status' : ProductVerificationStatus
  } |
  { 'error' : ApiError };
export type ProductVerificationStatus = { 'Invalid' : null } |
  { 'MultipleVerification' : null } |
  { 'FirstVerification' : null };
export interface RateLimitInfo {
  'current_window_start' : bigint,
  'remaining_attempts' : number,
  'reset_time' : bigint,
}
export interface Reseller {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'ecommerce_urls' : Array<Metadata>,
  'metadata' : Array<Metadata>,
  'name' : string,
  'org_id' : Principal,
  'date_joined' : bigint,
  'created_at' : bigint,
  'created_by' : Principal,
  'reseller_id' : string,
}
export interface ResellerInput {
  'ecommerce_urls' : Array<Metadata>,
  'metadata' : Array<Metadata>,
  'name' : string,
  'org_id' : Principal,
}
export interface ResellerUniqueCodeResponse {
  'context' : [] | [string],
  'unique_code' : string,
  'timestamp' : bigint,
  'reseller_id' : Principal,
}
export interface ResellerVerificationResponse {
  'status' : ResellerVerificationStatus,
  'reseller' : [] | [Reseller],
  'organization' : [] | [OrganizationPublic],
}
export type ResellerVerificationResult = {
    'result' : ResellerVerificationResultRecord
  } |
  { 'error' : ApiError };
export interface ResellerVerificationResultRecord {
  'status' : VerificationStatus,
  'organization' : OrganizationPublic,
  'registered_at' : [] | [bigint],
}
export type ResellerVerificationStatus = { 'ExpiredCode' : null } |
  { 'Success' : null } |
  { 'ReplayAttackDetected' : null } |
  { 'InvalidCode' : null } |
  { 'OrganizationNotFound' : null } |
  { 'InternalError' : null } |
  { 'ResellerNotFound' : null };
export interface ResponseMetadata {
  'request_id' : [] | [string],
  'version' : string,
  'timestamp' : bigint,
}
export type UniqueCodeResult = { 'error' : ApiError } |
  { 'unique_code' : string };
export interface UpdateOrganizationRequest {
  'id' : Principal,
  'metadata' : Array<Metadata>,
  'name' : string,
  'description' : string,
}
export interface User {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'user_role' : [] | [UserRole],
  'org_ids' : Array<Principal>,
  'is_principal' : boolean,
  'is_enabled' : boolean,
  'created_at' : bigint,
  'created_by' : Principal,
  'email' : [] | [string],
  'first_name' : [] | [string],
  'detail_meta' : Array<Metadata>,
  'last_name' : [] | [string],
  'phone_no' : [] | [string],
}
export interface UserDetailsInput {
  'email' : string,
  'first_name' : string,
  'detail_meta' : Array<Metadata>,
  'last_name' : string,
  'phone_no' : string,
}
export interface UserResponse { 'user' : User }
export type UserResult = { 'none' : null } |
  { 'user' : User } |
  { 'error' : ApiError };
export type UserRole = { 'Reseller' : null } |
  { 'Admin' : null } |
  { 'BrandOwner' : null };
export interface VerificationRewards {
  'special_reward' : [] | [string],
  'reward_description' : [] | [string],
  'is_first_verification' : boolean,
  'points' : number,
}
export type VerificationStatus = { 'Invalid' : null } |
  { 'Success' : null };
export interface VerifyProductEnhancedRequest {
  'product_id' : Principal,
  'metadata' : Array<Metadata>,
  'print_version' : number,
  'nonce' : [] | [string],
  'unique_code' : string,
  'timestamp' : [] | [bigint],
  'serial_no' : Principal,
}
export interface VerifyResellerRequestV2 {
  'context' : [] | [string],
  'unique_code' : string,
  'timestamp' : bigint,
  'reseller_id' : Principal,
}
export interface _SERVICE {
  'create_organization' : ActorMethod<[OrganizationInput], OrganizationPublic>,
  'create_organization_v2' : ActorMethod<
    [CreateOrganizationRequest],
    ApiResponse_OrganizationResponse
  >,
  'create_product' : ActorMethod<[ProductInput], ProductResult>,
  'create_product_serial_number' : ActorMethod<
    [Principal, [] | [string]],
    ProductSerialNumberResult
  >,
  'create_user' : ActorMethod<[Principal, UserDetailsInput], UserResult>,
  'find_organizations_by_name' : ActorMethod<
    [string],
    Array<OrganizationPublic>
  >,
  'find_resellers_by_name_or_id' : ActorMethod<[string], Array<Reseller>>,
  'generate_product_review' : ActorMethod<[Principal], [] | [Product]>,
  'generate_product_review_v2' : ActorMethod<
    [Principal],
    ApiResponse_ProductResponse
  >,
  'generate_reseller_unique_code' : ActorMethod<[Principal], UniqueCodeResult>,
  'generate_reseller_unique_code_v2' : ActorMethod<
    [GenerateResellerUniqueCodeRequest],
    ApiResponse_ResellerUniqueCodeResponse
  >,
  'get_openai_api_key' : ActorMethod<[], ApiResponse_Text>,
  'get_organization_by_id' : ActorMethod<[Principal], OrganizationPublic>,
  'get_organization_by_id_v2' : ActorMethod<
    [Principal],
    ApiResponse_OrganizationResponse
  >,
  'get_organization_private_key' : ActorMethod<[Principal], PrivateKeyResult>,
  'get_product_by_id' : ActorMethod<[Principal], ProductResult>,
  'get_scraper_url' : ActorMethod<[], ApiResponse_Text>,
  'get_user_by_id' : ActorMethod<[Principal], [] | [User]>,
  'get_verification_rate_limit' : ActorMethod<
    [Principal],
    ApiResponse_RateLimitInfo
  >,
  'greet' : ActorMethod<[string], string>,
  'list_organizations_v2' : ActorMethod<
    [FindOrganizationsRequest],
    ApiResponse_OrganizationsListResponse
  >,
  'list_product_serial_number' : ActorMethod<
    [[] | [Principal], [] | [Principal]],
    Array<ProductSerialNumber>
  >,
  'list_product_verifications' : ActorMethod<
    [[] | [Principal], [] | [Principal], [] | [Principal]],
    Array<ProductVerification>
  >,
  'list_product_verifications_by_user' : ActorMethod<
    [Principal, [] | [Principal]],
    Array<ProductVerification>
  >,
  'list_products' : ActorMethod<[Principal], Array<Product>>,
  'print_product_serial_number' : ActorMethod<
    [Principal, Principal],
    ProductUniqueCodeResult
  >,
  'register' : ActorMethod<[], User>,
  'register_as_organization' : ActorMethod<[OrganizationInput], UserResult>,
  'register_as_reseller' : ActorMethod<[ResellerInput], UserResult>,
  'register_as_reseller_v2' : ActorMethod<
    [ResellerInput],
    ApiResponse_UserResponse
  >,
  'set_openai_api_key' : ActorMethod<[string], ApiResponse_Unit>,
  'set_scraper_url' : ActorMethod<[string], ApiResponse_Unit>,
  'set_self_role' : ActorMethod<[UserRole], UserResult>,
  'update_organization' : ActorMethod<
    [Principal, OrganizationInput],
    OrganizationPublic
  >,
  'update_organization_v2' : ActorMethod<
    [UpdateOrganizationRequest],
    ApiResponse_OrganizationResponse
  >,
  'update_product' : ActorMethod<[Principal, ProductInput], Product>,
  'update_product_serial_number' : ActorMethod<
    [Principal, Principal, [] | [string]],
    ProductSerialNumberResult
  >,
  'update_self_details' : ActorMethod<[UserDetailsInput], UserResult>,
  'update_user' : ActorMethod<[Principal, UserDetailsInput], UserResult>,
  'update_user_orgs' : ActorMethod<[Principal, Array<Principal>], UserResult>,
  'verify_product' : ActorMethod<
    [Principal, Principal, number, string, Array<Metadata>],
    ProductVerificationResult
  >,
  'verify_product_v2' : ActorMethod<
    [VerifyProductEnhancedRequest],
    ApiResponse_ProductVerificationEnhancedResponse
  >,
  'verify_reseller' : ActorMethod<
    [Principal, string],
    ResellerVerificationResult
  >,
  'verify_reseller_v2' : ActorMethod<
    [VerifyResellerRequestV2],
    ApiResponse_ResellerVerificationResponse
  >,
  'whoami' : ActorMethod<[], [] | [User]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
