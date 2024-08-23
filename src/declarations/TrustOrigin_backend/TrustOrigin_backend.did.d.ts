import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface GenericError {
  'message' : string,
  'details' : Array<Metadata>,
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
export type OrganizationResult = { 'error' : GenericError } |
  { 'organization' : Organization };
export type PrivateKeyResult = { 'key' : string } |
  { 'error' : GenericError };
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
export type ProductResult = { 'none' : null } |
  { 'error' : GenericError } |
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
  { 'error' : GenericError };
export type ProductUniqueCodeResult = {
    'result' : ProductUniqueCodeResultRecord
  } |
  { 'error' : GenericError };
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
export type ProductVerificationResult = {
    'status' : ProductVerificationStatus
  } |
  { 'error' : GenericError };
export type ProductVerificationStatus = { 'Invalid' : null } |
  { 'MultipleVerification' : null } |
  { 'FirstVerification' : null };
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
export type ResellerVerificationResult = {
    'result' : ResellerVerificationResultRecord
  } |
  { 'error' : GenericError };
export interface ResellerVerificationResultRecord {
  'status' : VerificationStatus,
  'organization' : OrganizationPublic,
  'registered_at' : [] | [bigint],
}
export type UniqueCodeResult = { 'error' : GenericError } |
  { 'unique_code' : string };
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
export type UserResult = { 'none' : null } |
  { 'user' : User } |
  { 'error' : GenericError };
export type UserRole = { 'Reseller' : null } |
  { 'Admin' : null } |
  { 'BrandOwner' : null };
export type VerificationStatus = { 'Invalid' : null } |
  { 'Success' : null };
export interface _SERVICE {
  'create_organization' : ActorMethod<[OrganizationInput], OrganizationPublic>,
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
  'generate_reseller_unique_code' : ActorMethod<[Principal], UniqueCodeResult>,
  'get_organization_by_id' : ActorMethod<[Principal], OrganizationPublic>,
  'get_organization_private_key' : ActorMethod<[Principal], PrivateKeyResult>,
  'get_product_by_id' : ActorMethod<[Principal], ProductResult>,
  'get_user_by_id' : ActorMethod<[Principal], [] | [User]>,
  'greet' : ActorMethod<[string], string>,
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
  'set_self_role' : ActorMethod<[UserRole], UserResult>,
  'update_organization' : ActorMethod<
    [Principal, OrganizationInput],
    OrganizationPublic
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
  'verify_reseller' : ActorMethod<
    [Principal, string],
    ResellerVerificationResult
  >,
  'whoami' : ActorMethod<[], [] | [User]>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
