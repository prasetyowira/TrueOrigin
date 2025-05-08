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
export interface ApiResponse {
  'metadata' : ResponseMetadata,
  'data' : [] | [boolean],
  'error' : [] | [ApiError],
}
export interface ApiResponse_1 {
  'metadata' : ResponseMetadata,
  'data' : [] | [AuthContextResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_10 {
  'metadata' : ResponseMetadata,
  'data' : [] | [string],
  'error' : [] | [ApiError],
}
export interface ApiResponse_11 {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationAnalyticData],
  'error' : [] | [ApiError],
}
export interface ApiResponse_12 {
  'metadata' : ResponseMetadata,
  'data' : [] | [RateLimitInfo],
  'error' : [] | [ApiError],
}
export interface ApiResponse_13 {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationsListResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_14 {
  'metadata' : ResponseMetadata,
  'data' : [] | [LogoutResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_15 {
  'metadata' : ResponseMetadata,
  'data' : [] | [RedeemRewardResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_16 {
  'metadata' : ResponseMetadata,
  'data' : [] | [UserResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_17 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResetStorageResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_18 {
  'metadata' : ResponseMetadata,
  'data' : [] | [null],
  'error' : [] | [ApiError],
}
export interface ApiResponse_19 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ProductVerificationEnhancedResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_2 {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationContextResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_20 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResellerVerificationResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_3 {
  'metadata' : ResponseMetadata,
  'data' : [] | [OrganizationResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_4 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ProductResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_5 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResellerUniqueCodeResponse],
  'error' : [] | [ApiError],
}
export interface ApiResponse_6 {
  'metadata' : ResponseMetadata,
  'data' : [] | [Array<UserRole>],
  'error' : [] | [ApiError],
}
export interface ApiResponse_7 {
  'metadata' : ResponseMetadata,
  'data' : [] | [Array<OrganizationPublic>],
  'error' : [] | [ApiError],
}
export interface ApiResponse_8 {
  'metadata' : ResponseMetadata,
  'data' : [] | [ResellerCertificationPageContext],
  'error' : [] | [ApiError],
}
export interface ApiResponse_9 {
  'metadata' : ResponseMetadata,
  'data' : [] | [NavigationContextResponse],
  'error' : [] | [ApiError],
}
export interface AuthContextResponse {
  'reseller_details' : [] | [ResellerContextDetails],
  'role' : [] | [UserRole],
  'user' : [] | [UserPublic],
  'brand_owner_details' : [] | [BrandOwnerContextDetails],
  'is_registered' : boolean,
}
export interface BrandOwnerContextDetails {
  'active_organization' : [] | [OrganizationPublic],
  'has_organizations' : boolean,
  'organizations' : [] | [Array<OrganizationPublic>],
}
export interface CompleteResellerProfileRequest {
  'ecommerce_urls' : Array<Metadata>,
  'additional_metadata' : [] | [Array<Metadata>],
  'contact_email' : [] | [string],
  'contact_phone' : [] | [string],
  'target_organization_id' : Principal,
  'reseller_name' : string,
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
export interface GetOrganizationAnalyticRequest { 'org_id' : Principal }
export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface LogoutResponse {
  'redirect_url' : [] | [string],
  'message' : string,
}
export interface Metadata { 'key' : string, 'value' : string }
export interface NavigationContextResponse {
  'user_display_name' : string,
  'user_avatar_id' : [] | [string],
  'current_organization_name' : [] | [string],
}
export interface OrganizationAnalyticData {
  'total_products' : bigint,
  'active_resellers' : bigint,
  'verifications_this_month' : bigint,
}
export interface OrganizationContextResponse {
  'user_auth_context' : AuthContextResponse,
  'organization' : OrganizationPublic,
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
  { 'organization' : OrganizationPublic };
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
  'status' : ProductVerificationStatus,
  'product_id' : Principal,
  'reward_claimed' : boolean,
  'metadata' : Array<Metadata>,
  'reward_transaction_id' : [] | [string],
  'created_at' : bigint,
  'created_by' : Principal,
  'print_version' : number,
  'serial_no' : Principal,
}
export interface ProductVerificationDetail {
  'status' : ProductVerificationStatus,
  'user_email' : [] | [string],
  'product_id' : Principal,
  'created_at' : bigint,
  'product_name' : string,
  'serial_no' : Principal,
}
export interface ProductVerificationEnhancedResponse {
  'status' : ProductVerificationStatus,
  'expiration' : [] | [bigint],
  'rewards' : [] | [VerificationRewards],
  'verification' : [] | [ProductVerification],
}
export type ProductVerificationStatus = { 'Invalid' : null } |
  { 'MultipleVerification' : null } |
  { 'FirstVerification' : null };
export interface RateLimitInfo {
  'current_window_start' : bigint,
  'remaining_attempts' : number,
  'reset_time' : bigint,
}
export interface RedeemRewardRequest {
  'wallet_address' : string,
  'unique_code' : string,
  'serial_no' : Principal,
}
export interface RedeemRewardResponse {
  'transaction_id' : [] | [string],
  'message' : string,
  'success' : boolean,
}
export interface Reseller {
  'id' : Principal,
  'updated_at' : bigint,
  'updated_by' : Principal,
  'ecommerce_urls' : Array<Metadata>,
  'public_key' : string,
  'metadata' : Array<Metadata>,
  'additional_metadata' : [] | [Array<Metadata>],
  'name' : string,
  'org_id' : Principal,
  'contact_email' : [] | [string],
  'certification_code' : [] | [string],
  'certification_timestamp' : [] | [bigint],
  'date_joined' : bigint,
  'created_at' : bigint,
  'created_by' : Principal,
  'user_id' : Principal,
  'is_verified' : boolean,
  'contact_phone' : [] | [string],
}
export interface ResellerCertificationPageContext {
  'certification_code' : string,
  'certification_timestamp' : bigint,
  'reseller_profile' : ResellerPublic,
  'user_details' : UserPublic,
  'associated_organization' : OrganizationPublic,
}
export interface ResellerContextDetails {
  'certification_code' : [] | [string],
  'certification_timestamp' : [] | [bigint],
  'associated_organization' : [] | [OrganizationPublic],
  'is_profile_complete_and_verified' : boolean,
}
export interface ResellerInput {
  'ecommerce_urls' : Array<Metadata>,
  'metadata' : Array<Metadata>,
  'name' : string,
  'org_id' : Principal,
}
export interface ResellerPublic {
  'id' : Principal,
  'updated_at' : bigint,
  'ecommerce_urls' : Array<Metadata>,
  'public_key' : string,
  'additional_metadata' : [] | [Array<Metadata>],
  'name' : string,
  'contact_email' : [] | [string],
  'certification_code' : [] | [string],
  'certification_timestamp' : [] | [bigint],
  'created_at' : bigint,
  'user_id' : Principal,
  'is_verified' : boolean,
  'contact_phone' : [] | [string],
  'organization_id' : Principal,
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
export type ResellerVerificationStatus = { 'ExpiredCode' : null } |
  { 'Success' : null } |
  { 'ReplayAttackDetected' : null } |
  { 'InvalidCode' : null } |
  { 'OrganizationNotFound' : null } |
  { 'InternalError' : null } |
  { 'ResellerNotFound' : null };
export interface ResetStorageResponse { 'message' : string }
export interface ResponseMetadata {
  'request_id' : [] | [string],
  'version' : string,
  'timestamp' : bigint,
}
export type Result = { 'Ok' : Array<ProductSerialNumber> } |
  { 'Err' : ApiError };
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
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
  'active_org_id' : [] | [Principal],
  'first_name' : [] | [string],
  'detail_meta' : Array<Metadata>,
  'last_name' : [] | [string],
  'phone_no' : [] | [string],
  'session_keys' : Array<Principal>,
}
export interface UserDetailsInput {
  'email' : string,
  'first_name' : string,
  'detail_meta' : Array<Metadata>,
  'last_name' : string,
  'phone_no' : string,
}
export interface UserPublic {
  'id' : Principal,
  'created_at' : bigint,
  'email' : [] | [string],
  'first_name' : [] | [string],
  'last_name' : [] | [string],
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
export interface VerifyProductEnhancedRequest {
  'unique_code' : string,
  'serial_no' : Principal,
}
export interface VerifyResellerRequest {
  'context' : [] | [string],
  'unique_code' : string,
  'timestamp' : bigint,
  'reseller_id' : Principal,
}
export interface _SERVICE {
  'check_reseller_verification' : ActorMethod<[Principal], ApiResponse>,
  'complete_reseller_profile' : ActorMethod<
    [CompleteResellerProfileRequest],
    ApiResponse_1
  >,
  'create_organization' : ActorMethod<[OrganizationInput], OrganizationPublic>,
  'create_organization_for_owner' : ActorMethod<
    [OrganizationInput],
    ApiResponse_2
  >,
  'create_organization_v2' : ActorMethod<[OrganizationInput], ApiResponse_3>,
  'create_product' : ActorMethod<[ProductInput], ProductResult>,
  'create_product_serial_number' : ActorMethod<
    [Principal],
    ProductSerialNumberResult
  >,
  'create_user' : ActorMethod<[Principal, UserDetailsInput], UserResult>,
  'find_organizations_by_name' : ActorMethod<
    [string],
    Array<OrganizationPublic>
  >,
  'find_resellers_by_name_or_id' : ActorMethod<[string], Array<Reseller>>,
  'generate_product_review_v2' : ActorMethod<[Principal], ApiResponse_4>,
  'generate_reseller_unique_code_v2' : ActorMethod<
    [GenerateResellerUniqueCodeRequest],
    ApiResponse_5
  >,
  'get_auth_context' : ActorMethod<[], ApiResponse_1>,
  'get_available_roles' : ActorMethod<[], ApiResponse_6>,
  'get_my_organizations' : ActorMethod<[], ApiResponse_7>,
  'get_my_reseller_certification' : ActorMethod<[], ApiResponse_8>,
  'get_navigation_context' : ActorMethod<[], ApiResponse_9>,
  'get_openai_api_key' : ActorMethod<[], ApiResponse_10>,
  'get_organization_analytic' : ActorMethod<
    [GetOrganizationAnalyticRequest],
    ApiResponse_11
  >,
  'get_organization_by_id' : ActorMethod<[Principal], OrganizationResult>,
  'get_organization_by_id_v2' : ActorMethod<[Principal], ApiResponse_3>,
  'get_organization_private_key' : ActorMethod<[Principal], PrivateKeyResult>,
  'get_product_by_id' : ActorMethod<[Principal], ProductResult>,
  'get_scraper_url' : ActorMethod<[], ApiResponse_10>,
  'get_user_by_id' : ActorMethod<[Principal], [] | [User]>,
  'get_verification_rate_limit' : ActorMethod<[Principal], ApiResponse_12>,
  'greet' : ActorMethod<[string], string>,
  'initialize_user_session' : ActorMethod<[[] | [UserRole]], ApiResponse_1>,
  'list_organizations_v2' : ActorMethod<
    [FindOrganizationsRequest],
    ApiResponse_13
  >,
  'list_product_serial_numbers' : ActorMethod<
    [[] | [Principal], [] | [Principal]],
    Result
  >,
  'list_product_verifications_by_org_id' : ActorMethod<
    [Principal],
    Array<ProductVerificationDetail>
  >,
  'list_products' : ActorMethod<[Principal], Array<Product>>,
  'list_resellers_by_org_id' : ActorMethod<[Principal], Array<Reseller>>,
  'logout_user' : ActorMethod<[], ApiResponse_14>,
  'print_product_serial_number' : ActorMethod<
    [Principal, Principal],
    ProductUniqueCodeResult
  >,
  'redeem_product_reward' : ActorMethod<[RedeemRewardRequest], ApiResponse_15>,
  'register' : ActorMethod<[], User>,
  'register_as_organization' : ActorMethod<[OrganizationInput], UserResult>,
  'register_as_reseller_v2' : ActorMethod<[ResellerInput], ApiResponse_16>,
  'reset_all_stable_storage' : ActorMethod<[], ApiResponse_17>,
  'select_active_organization' : ActorMethod<[Principal], ApiResponse_1>,
  'set_openai_api_key' : ActorMethod<[string], ApiResponse_18>,
  'set_scraper_url' : ActorMethod<[string], ApiResponse_18>,
  'set_self_role' : ActorMethod<[UserRole], UserResult>,
  'transform' : ActorMethod<[TransformArgs], HttpResponse>,
  'update_organization' : ActorMethod<
    [Principal, OrganizationInput],
    OrganizationResult
  >,
  'update_organization_v2' : ActorMethod<
    [UpdateOrganizationRequest],
    ApiResponse_3
  >,
  'update_product' : ActorMethod<[Principal, ProductInput], ProductResult>,
  'update_product_serial_number' : ActorMethod<
    [Principal, Principal],
    ProductSerialNumberResult
  >,
  'update_self_details' : ActorMethod<[UserDetailsInput], UserResult>,
  'update_user' : ActorMethod<[Principal, UserDetailsInput], UserResult>,
  'update_user_orgs' : ActorMethod<[Principal, Array<Principal>], UserResult>,
  'verify_product_v2' : ActorMethod<
    [VerifyProductEnhancedRequest],
    ApiResponse_19
  >,
  'verify_reseller_v2' : ActorMethod<[VerifyResellerRequest], ApiResponse_20>,
  'whoami' : ActorMethod<[], [] | [User]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
