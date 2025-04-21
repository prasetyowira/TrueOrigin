use candid::Principal;

use crate::error::ApiError;
use crate::global_state::{ORGANIZATIONS, USERS};
use crate::models::Organization;

pub fn authorize_user_organization(user_id: Principal, org_id: Principal) -> Result<Organization, ApiError> {
    let user_opt = USERS.with(|users_refcell| {
        users_refcell.borrow().get(&user_id)
    });

    if user_opt.is_none() {
        return Err(ApiError::not_found("User not found!"));
    }
    let user = user_opt.unwrap();

    let organization_opt = ORGANIZATIONS.with(|orgs_refcell| {
        orgs_refcell.borrow().get(&org_id)
    });

    if organization_opt.is_none() {
        return Err(ApiError::not_found("Organization not found!"));
    }
    let organization = organization_opt.unwrap();

    if user.org_ids.contains(&org_id) {
        Ok(organization.clone())
    } else {
        Err(ApiError::unauthorized("User is not authorized for this organization!"))
    }
}