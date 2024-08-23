export const idlFactory = ({ IDL }) => {
  const Metadata = IDL.Record({ 'key' : IDL.Text, 'value' : IDL.Text });
  const OrganizationInput = IDL.Record({
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const OrganizationPublic = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
  });
  const ProductInput = IDL.Record({
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'description' : IDL.Text,
    'category' : IDL.Text,
  });
  const GenericError = IDL.Record({
    'message' : IDL.Text,
    'details' : IDL.Vec(Metadata),
  });
  const Product = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'public_key' : IDL.Text,
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'description' : IDL.Text,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'category' : IDL.Text,
  });
  const ProductResult = IDL.Variant({
    'none' : IDL.Null,
    'error' : GenericError,
    'product' : Product,
  });
  const ProductSerialNumber = IDL.Record({
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'product_id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'print_version' : IDL.Nat8,
    'user_serial_no' : IDL.Text,
    'serial_no' : IDL.Principal,
  });
  const ProductSerialNumberResult = IDL.Variant({
    'result' : ProductSerialNumber,
    'error' : GenericError,
  });
  const UserDetailsInput = IDL.Record({
    'email' : IDL.Text,
    'first_name' : IDL.Text,
    'detail_meta' : IDL.Vec(Metadata),
    'last_name' : IDL.Text,
    'phone_no' : IDL.Text,
  });
  const UserRole = IDL.Variant({
    'Reseller' : IDL.Null,
    'Admin' : IDL.Null,
    'BrandOwner' : IDL.Null,
  });
  const User = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'user_role' : IDL.Opt(UserRole),
    'org_ids' : IDL.Vec(IDL.Principal),
    'is_principal' : IDL.Bool,
    'is_enabled' : IDL.Bool,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'email' : IDL.Opt(IDL.Text),
    'first_name' : IDL.Opt(IDL.Text),
    'detail_meta' : IDL.Vec(Metadata),
    'last_name' : IDL.Opt(IDL.Text),
    'phone_no' : IDL.Opt(IDL.Text),
  });
  const UserResult = IDL.Variant({
    'none' : IDL.Null,
    'user' : User,
    'error' : GenericError,
  });
  const Reseller = IDL.Record({
    'id' : IDL.Principal,
    'updated_at' : IDL.Nat64,
    'updated_by' : IDL.Principal,
    'ecommerce_urls' : IDL.Vec(Metadata),
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
    'date_joined' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'reseller_id' : IDL.Text,
  });
  const UniqueCodeResult = IDL.Variant({
    'error' : GenericError,
    'unique_code' : IDL.Text,
  });
  const PrivateKeyResult = IDL.Variant({
    'key' : IDL.Text,
    'error' : GenericError,
  });
  const ProductVerification = IDL.Record({
    'id' : IDL.Principal,
    'product_id' : IDL.Principal,
    'metadata' : IDL.Vec(Metadata),
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'print_version' : IDL.Nat8,
    'serial_no' : IDL.Principal,
  });
  const ProductUniqueCodeResultRecord = IDL.Record({
    'product_id' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'print_version' : IDL.Nat8,
    'unique_code' : IDL.Text,
    'serial_no' : IDL.Principal,
  });
  const ProductUniqueCodeResult = IDL.Variant({
    'result' : ProductUniqueCodeResultRecord,
    'error' : GenericError,
  });
  const ResellerInput = IDL.Record({
    'ecommerce_urls' : IDL.Vec(Metadata),
    'metadata' : IDL.Vec(Metadata),
    'name' : IDL.Text,
    'org_id' : IDL.Principal,
  });
  const ProductVerificationStatus = IDL.Variant({
    'Invalid' : IDL.Null,
    'MultipleVerification' : IDL.Null,
    'FirstVerification' : IDL.Null,
  });
  const ProductVerificationResult = IDL.Variant({
    'status' : ProductVerificationStatus,
    'error' : GenericError,
  });
  const VerificationStatus = IDL.Variant({
    'Invalid' : IDL.Null,
    'Success' : IDL.Null,
  });
  const ResellerVerificationResultRecord = IDL.Record({
    'status' : VerificationStatus,
    'organization' : OrganizationPublic,
    'registered_at' : IDL.Opt(IDL.Nat64),
  });
  const ResellerVerificationResult = IDL.Variant({
    'result' : ResellerVerificationResultRecord,
    'error' : GenericError,
  });
  return IDL.Service({
    'create_organization' : IDL.Func(
        [OrganizationInput],
        [OrganizationPublic],
        [],
      ),
    'create_product' : IDL.Func([ProductInput], [ProductResult], []),
    'create_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Text)],
        [ProductSerialNumberResult],
        [],
      ),
    'create_user' : IDL.Func(
        [IDL.Principal, UserDetailsInput],
        [UserResult],
        [],
      ),
    'find_organizations_by_name' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(OrganizationPublic)],
        ['query'],
      ),
    'find_resellers_by_name_or_id' : IDL.Func(
        [IDL.Text],
        [IDL.Vec(Reseller)],
        ['query'],
      ),
    'generate_product_review' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(Product)],
        [],
      ),
    'generate_reseller_unique_code' : IDL.Func(
        [IDL.Principal],
        [UniqueCodeResult],
        ['query'],
      ),
    'get_organization_by_id' : IDL.Func(
        [IDL.Principal],
        [OrganizationPublic],
        ['query'],
      ),
    'get_organization_private_key' : IDL.Func(
        [IDL.Principal],
        [PrivateKeyResult],
        ['query'],
      ),
    'get_product_by_id' : IDL.Func([IDL.Principal], [ProductResult], ['query']),
    'get_user_by_id' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'list_product_serial_number' : IDL.Func(
        [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Principal)],
        [IDL.Vec(ProductSerialNumber)],
        ['query'],
      ),
    'list_product_verifications' : IDL.Func(
        [
          IDL.Opt(IDL.Principal),
          IDL.Opt(IDL.Principal),
          IDL.Opt(IDL.Principal),
        ],
        [IDL.Vec(ProductVerification)],
        ['query'],
      ),
    'list_product_verifications_by_user' : IDL.Func(
        [IDL.Principal, IDL.Opt(IDL.Principal)],
        [IDL.Vec(ProductVerification)],
        ['query'],
      ),
    'list_products' : IDL.Func([IDL.Principal], [IDL.Vec(Product)], ['query']),
    'print_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Principal],
        [ProductUniqueCodeResult],
        [],
      ),
    'register' : IDL.Func([], [User], []),
    'register_as_organization' : IDL.Func(
        [OrganizationInput],
        [UserResult],
        [],
      ),
    'register_as_reseller' : IDL.Func([ResellerInput], [UserResult], []),
    'set_self_role' : IDL.Func([UserRole], [UserResult], []),
    'update_organization' : IDL.Func(
        [IDL.Principal, OrganizationInput],
        [OrganizationPublic],
        [],
      ),
    'update_product' : IDL.Func([IDL.Principal, ProductInput], [Product], []),
    'update_product_serial_number' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Opt(IDL.Text)],
        [ProductSerialNumberResult],
        [],
      ),
    'update_self_details' : IDL.Func([UserDetailsInput], [UserResult], []),
    'update_user' : IDL.Func(
        [IDL.Principal, UserDetailsInput],
        [UserResult],
        [],
      ),
    'update_user_orgs' : IDL.Func(
        [IDL.Principal, IDL.Vec(IDL.Principal)],
        [UserResult],
        [],
      ),
    'verify_product' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Nat8, IDL.Text, IDL.Vec(Metadata)],
        [ProductVerificationResult],
        [],
      ),
    'verify_reseller' : IDL.Func(
        [IDL.Principal, IDL.Text],
        [ResellerVerificationResult],
        ['query'],
      ),
    'whoami' : IDL.Func([], [IDL.Opt(User)], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
