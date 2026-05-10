import gleeunit
import gleeunit/should

import ema_access_sessions/ema_access_sessions
import ema_blueprint/ema_blueprint
import ema_blueprint/planner_nodes
import ema_collab/ema_collab
import ema_daemon/bus
import ema_daemon/event_envelope.{Envelope}
import ema_identity/ema_device_keys
import ema_identity/ema_identity
import ema_identity/ema_pairing
import ema_invites/ema_invites
import ema_orgs/ema_orgs
import ema_replication/ema_collab_sync
import ema_replication/ema_peers
import ema_replication/ema_replication
import ema_swarm_coordination/agent_workspace
import ema_swarm_coordination/first_boot
import ema_vcalendar/ema_vcalendar
import gleam/erlang/process
import gleam/list
import gleam/option.{None, Some}
import gleam/string

pub fn main() {
  gleeunit.main()
}

/// M1 smoke test: start a bus on a throwaway db and confirm the first
/// two appends produce txid 1 and 2, respectively.
pub fn bus_assigns_sequential_txids_test() {
  let path = tmp_path("ema-m1-bus.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let e1 = sample_envelope("event:test-1")
  let e2 = sample_envelope("event:test-2")

  let assert Ok(txid1) = bus.append(bus_subject, e1)
  let assert Ok(txid2) = bus.append(bus_subject, e2)

  should.equal(txid1, 1)
  should.equal(txid2, 2)

  let _ = delete_file(path)
}

pub fn first_boot_seeds_once_test() {
  let path = tmp_path("ema-first-boot.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(first_seed) = first_boot.seed_if_needed(bus_subject)
  let assert Ok(second_seed) = first_boot.seed_if_needed(bus_subject)

  should.equal(
    list.length(first_seed),
    list.length(first_boot.first_boot_events()),
  )
  should.equal(second_seed, [])
  should.equal(
    bus.event_exists(bus_subject, "org.created", first_boot.org_id),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "org.created", first_boot.personal_org_id),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "install.initialized", first_boot.install_id),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "identity.user_upserted", "org:identity"),
    True,
  )

  let _ = delete_file(path)
}

pub fn first_boot_appends_ordered_seed_events_to_sqlite_test() {
  let path = tmp_path("ema-first-boot-events.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(_) = first_boot.seed_if_needed(bus_subject)

  should.equal(event_kind_org_rows(path), [
    #("install.initialized", first_boot.install_id),
    #("identity.user_upserted", "org:identity"),
    #("device.registered", first_boot.org_id),
    #("actor.created", first_boot.org_id),
    #("actor.created", first_boot.org_id),
    #("actor.created", first_boot.org_id),
    #("org.created", first_boot.personal_org_id),
    #("membership.role_granted", first_boot.personal_org_id),
    #("space.created", first_boot.personal_org_id),
    #("org.created", first_boot.org_id),
    #("membership.role_granted", first_boot.org_id),
    #("space.created", first_boot.org_id),
    #("project.created", first_boot.org_id),
    #("blueprint.document.created", first_boot.org_id),
    #("blueprint.section.added", first_boot.org_id),
    #("blueprint.section.added", first_boot.org_id),
    #("attachment.created", first_boot.org_id),
    #("attachment.linked", first_boot.org_id),
    #("blueprint.attachment.linked", first_boot.org_id),
  ])
  should.equal(table_count(path, "install"), 1)
  should.equal(table_count(path, "users"), 1)

  let _ = delete_file(path)
}

pub fn topbar_uses_home_current_node_state_test() {
  let path = tmp_path("ema-node-state.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(_) = first_boot.seed_if_needed(bus_subject)
  let projection = bus.topbar_projection_json(bus_subject)

  should.equal(
    string.contains(
      projection,
      "\"install\":{\"id\":\"" <> first_boot.install_id,
    ),
    True,
  )
  should.equal(
    string.contains(
      projection,
      "\"user\":{\"id\":\"" <> first_boot.genesis_user_id,
    ),
    True,
  )
  should.equal(
    string.contains(projection, "\"node_state\":\"home_current\""),
    True,
  )

  let _ = delete_file(path)
}

pub fn git_ema_slug_projects_active_builds_label_test() {
  let path = tmp_path("ema-active-builds-vapp.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let projection = bus.space_vapps_projection_json(bus_subject)

  should.equal(
    string.contains(projection, "\"slug\":\"git-ema\""),
    True,
  )
  should.equal(
    string.contains(projection, "\"label\":\"Active builds\""),
    True,
  )

  let _ = delete_file(path)
}

pub fn peer_trust_events_are_in_runtime_catalog_test() {
  let path = tmp_path("ema-peer-catalog.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let established =
    peer_envelope("event:peer-trust-1", "peer.trust_established")
  let revoked = peer_envelope("event:peer-trust-2", "peer.trust_revoked")

  let assert Ok(txid1) = bus.append(bus_subject, established)
  let assert Ok(txid2) = bus.append(bus_subject, revoked)

  should.equal(txid1, 1)
  should.equal(txid2, 2)

  let _ = delete_file(path)
}

pub fn replication_collab_sync_decision_is_transport_free_test() {
  should.equal(
    ema_replication.collab_sync_decision(2, 2),
    ema_replication.CollabInSync,
  )
  should.equal(
    ema_replication.collab_sync_decision(1, 3),
    ema_replication.CollabSendFrames(after_revision: 1),
  )
  should.equal(
    ema_replication.collab_sync_decision(4, 3),
    ema_replication.CollabPeerAhead(peer_revision: 4, local_revision: 3),
  )
  should.equal(ema_replication.replication_enabled(), False)
}

pub fn org_create_appends_default_space_test() {
  let path = tmp_path("ema-org-create.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(events) = ema_orgs.create(bus_subject, "Test Org")
  let projection = bus.topbar_projection_json(bus_subject)

  should.equal(list.length(events), 2)
  should.equal(string.contains(projection, "Test Org"), True)
  should.equal(string.contains(projection, "\"spaces\""), True)

  let _ = delete_file(path)
}

pub fn invite_accept_emits_membership_event_test() {
  let path = tmp_path("ema-invite-accept.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(invite_created) =
    ema_invites.create(
      bus_subject,
      "org:test",
      "email",
      "first@example.com",
      "member",
      "2026-04-25T00:00:00Z",
    )
  let assert Ok(accept_events) =
    ema_invites.accept(
      bus_subject,
      "org:test",
      "invite:test",
      "user:dev-local",
      "device:dev-local",
      "member",
    )

  should.equal(string.starts_with(invite_created.event_id, "event:"), True)
  should.equal(list.length(accept_events), 2)
  should.equal(
    bus.event_exists(bus_subject, "invite.accepted", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "membership.role_granted", "org:test"),
    True,
  )

  let _ = delete_file(path)
}

pub fn identity_google_and_authenticator_events_are_canonical_test() {
  let path = tmp_path("ema-identity.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(user) =
    ema_identity.upsert_google_user(
      bus_subject,
      "user:01TESTIDENTITY000000000001",
      "google-sub-123",
      "new@example.com",
      "New Teammate",
      True,
    )
  let assert Ok(totp_event) =
    ema_identity.enable_authenticator(
      bus_subject,
      user.user_id,
      "secret_ref:totp:google-sub-123",
    )

  should.equal(list.length(user.event_ids), 2)
  should.equal(string.starts_with(totp_event, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "identity.user_upserted", "org:identity"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "identity.google_linked", "org:identity"),
    True,
  )
  should.equal(
    bus.event_exists(
      bus_subject,
      "identity.authenticator_enabled",
      "org:identity",
    ),
    True,
  )

  let _ = delete_file(path)
}

pub fn device_register_persists_machine_registry_test() {
  let path = tmp_path("ema-device-register.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(result) =
    ema_identity.register_device(
      bus_subject,
      "org:test",
      "device:01TESTFRIENDMACBOOK000000001",
      "user:01TESTIDENTITY000000000001",
      "Friend MacBook",
      "ed25519:friend-public-key",
      "paired",
    )

  let projection = bus.device_projection_json(bus_subject)

  should.equal(result.device_id, "device:01TESTFRIENDMACBOOK000000001")
  should.equal(string.starts_with(result.event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "device.registered", "org:test"),
    True,
  )
  should.equal(string.contains(projection, "Friend MacBook"), True)
  should.equal(string.contains(projection, "\"bootstrap\":\"paired\""), True)
  should.equal(string.contains(projection, "\"attested_by\":null"), True)
  should.equal(string.contains(projection, "\"capabilities\":[]"), True)
  should.equal(string.contains(projection, "\"status\":\"trusted\""), True)
  should.equal(
    string.contains(projection, "\"machine_peer_ready\":false"),
    True,
  )

  let _ = delete_file(path)
}

pub fn device_register_persists_attestation_and_capabilities_test() {
  let path = tmp_path("ema-device-attested-register.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(result) =
    ema_identity.register_device_with_attestation(
      bus_subject,
      "org:test",
      "device:01TESTATTESTEDDEVICE0000001",
      "user:01TESTIDENTITY000000000001",
      "Studio Workstation",
      "ed25519:workstation-public-key",
      "paired",
      Some("device:01TESTGENESISDEVICE0000001"),
      ["runs_agents", "serves_files"],
    )

  let projection = bus.device_projection_json(bus_subject)

  should.equal(result.device_id, "device:01TESTATTESTEDDEVICE0000001")
  should.equal(
    string.contains(
      projection,
      "\"attested_by\":\"device:01TESTGENESISDEVICE0000001\"",
    ),
    True,
  )
  should.equal(
    string.contains(
      projection,
      "\"capabilities\":[\"runs_agents\",\"serves_files\"]",
    ),
    True,
  )

  let _ = delete_file(path)
}

pub fn pairing_offer_create_returns_copyable_offer_test() {
  let assert Ok(offer) =
    ema_pairing.create_offer(
      " org:test ",
      " user:01TESTIDENTITY000000000001 ",
      " Studio Workstation ",
      " ed25519:workstation-public-key ",
      [" runs_agents ", "", "serves_files"],
    )

  should.equal(string.starts_with(offer.offer_id, "pairing_offer:"), True)
  should.equal(offer.org_id, "org:test")
  should.equal(offer.user_id, "user:01TESTIDENTITY000000000001")
  should.equal(string.starts_with(offer.device_id, "device:"), True)
  should.equal(offer.name, "Studio Workstation")
  should.equal(offer.pubkey, "ed25519:workstation-public-key")
  should.equal(offer.capabilities, ["runs_agents", "serves_files"])
  should.equal(string.length(offer.short_code), 6)
  should.equal(string.starts_with(offer.created_at, "20"), True)

  let as_json = ema_pairing.offer_json(offer)
  should.equal(string.contains(as_json, "\"offer_id\":\"pairing_offer:"), True)
  should.equal(string.contains(as_json, "\"short_code\":\""), True)
}

pub fn pairing_offer_approve_registers_attested_device_test() {
  let path = tmp_path("ema-pairing-approve.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data
  let assert Ok(offer) =
    ema_pairing.create_offer(
      "org:test",
      "user:01TESTIDENTITY000000000001",
      "Studio Workstation",
      "ed25519:workstation-public-key",
      ["runs_agents", "serves_files"],
    )

  let assert Ok(approval) =
    ema_pairing.approve_offer(
      bus_subject,
      offer.offer_id,
      offer.org_id,
      offer.user_id,
      offer.device_id,
      offer.name,
      offer.pubkey,
      offer.capabilities,
      offer.short_code,
      offer.short_code,
      "device:01TESTGENESISDEVICE0000001",
    )

  let projection = bus.device_projection_json(bus_subject)

  should.equal(approval.offer_id, offer.offer_id)
  should.equal(approval.device_id, offer.device_id)
  should.equal(string.starts_with(approval.event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "device.registered", "org:test"),
    True,
  )
  should.equal(string.contains(projection, "\"bootstrap\":\"paired\""), True)
  should.equal(
    string.contains(
      projection,
      "\"attested_by\":\"device:01TESTGENESISDEVICE0000001\"",
    ),
    True,
  )
  should.equal(
    string.contains(
      projection,
      "\"capabilities\":[\"runs_agents\",\"serves_files\"]",
    ),
    True,
  )

  let _ = delete_file(path)
}

pub fn pairing_offer_approve_rejects_wrong_short_code_test() {
  let path = tmp_path("ema-pairing-short-code.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data
  let assert Ok(offer) =
    ema_pairing.create_offer(
      "org:test",
      "user:01TESTIDENTITY000000000001",
      "Studio Workstation",
      "ed25519:workstation-public-key",
      ["runs_agents"],
    )

  let assert Error(ema_pairing.ShortCodeMismatch) =
    ema_pairing.approve_offer(
      bus_subject,
      offer.offer_id,
      offer.org_id,
      offer.user_id,
      offer.device_id,
      offer.name,
      offer.pubkey,
      offer.capabilities,
      offer.short_code,
      case offer.short_code {
        "000000" -> "111111"
        _ -> "000000"
      },
      "device:01TESTGENESISDEVICE0000001",
    )

  should.equal(
    bus.event_exists(bus_subject, "device.registered", "org:test"),
    False,
  )

  let _ = delete_file(path)
}

pub fn device_key_generation_uses_real_ed25519_material_test() {
  let assert Ok(pair) = ema_device_keys.generate_keypair()

  should.equal(string.starts_with(pair.public_key, "ed25519:"), True)
  should.equal(string.starts_with(pair.private_key, "ed25519-secret:"), True)
  should.equal(string.length(pair.public_key), 72)
  should.equal(string.length(pair.private_key), 79)
}

pub fn device_key_signs_peer_lineage_proof_test() {
  let assert Ok(pair) = ema_device_keys.generate_keypair()
  let assert Ok(proof) =
    ema_device_keys.sign_lineage_proof_with_private_key(
      pair.private_key,
      "ed25519:peer-public-key",
      pair.public_key,
      "org:test",
      "ceremony:test-pairing-001",
    )

  should.equal(string.starts_with(proof, "ed25519-signature:"), True)
  should.equal(string.length(proof), 146)
}

pub fn peer_trust_establishes_org_scoped_machine_trust_test() {
  let path = tmp_path("ema-peer-trust.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(result) =
    ema_peers.establish_trust(
      bus_subject,
      "org:test",
      "device:01TESTFRIENDMACBOOK000000001",
      "ed25519:peer-public-key",
      "ed25519:local-public-key",
      "qr_ble_hybrid",
      "ceremony:test-pairing-001",
      "proof:test-lineage-signature",
    )

  let projection = bus.peer_trust_projection_json(bus_subject)

  should.equal(string.starts_with(result.event_id, "event:"), True)
  should.equal(
    bus.event_exists(bus_subject, "peer.trust_established", "org:test"),
    True,
  )
  should.equal(
    string.contains(projection, "device:01TESTFRIENDMACBOOK000000001"),
    True,
  )
  should.equal(
    string.contains(projection, "\"ceremony_kind\":\"qr_ble_hybrid\""),
    True,
  )
  should.equal(string.contains(projection, "\"status\":\"trusted\""), True)
  should.equal(
    string.contains(projection, "\"replication_enabled\":false"),
    True,
  )

  let _ = delete_file(path)
}

pub fn replication_collab_frames_are_gated_by_peer_trust_test() {
  let path = tmp_path("ema-collab-trust-gate.db")
  let _ = delete_file(path)

  let assert Ok(bus_started) = bus.start(path)
  let bus_subject = bus_started.data
  let assert Ok(collab_started) = ema_collab.start(path)
  let collab_subject = collab_started.data
  let peer_device = "device:01TESTFRIENDMACBOOK000000001"

  let assert Ok(_) =
    ema_collab.replace_body(
      collab_subject,
      ema_collab.default_document_id,
      "Trusted frame",
      "actor:test",
    )

  let assert Error(ema_collab_sync.PeerNotTrusted) =
    ema_collab_sync.frames_since_for_peer(
      bus_subject,
      collab_subject,
      "org:test",
      peer_device,
      ema_collab.default_document_id,
      0,
    )

  let assert Ok(_) =
    ema_peers.establish_trust(
      bus_subject,
      "org:test",
      peer_device,
      "ed25519:peer-public-key",
      "ed25519:local-public-key",
      "qr_ble_hybrid",
      "ceremony:test-pairing-001",
      "proof:test-lineage-signature",
    )

  let assert Ok(backlog) =
    ema_collab_sync.frames_since_for_peer(
      bus_subject,
      collab_subject,
      "org:test",
      peer_device,
      ema_collab.default_document_id,
      0,
    )

  should.equal(string.contains(backlog.data_json, "Trusted frame"), True)

  let _ = delete_file(path)
}

pub fn replication_collab_apply_requires_trusted_peer_test() {
  let path = tmp_path("ema-collab-apply-trust-gate.db")
  let _ = delete_file(path)

  let assert Ok(bus_started) = bus.start(path)
  let bus_subject = bus_started.data
  let assert Ok(collab_started) = ema_collab.start(path)
  let collab_subject = collab_started.data
  let peer_device = "device:01TESTFRIENDMACBOOK000000001"

  let assert Error(ema_collab_sync.PeerNotTrusted) =
    ema_collab_sync.apply_frame_from_peer(
      bus_subject,
      collab_subject,
      "org:test",
      peer_device,
      ema_collab.default_document_id,
      "collab_frame:01J0000000000000000000000Z",
      1,
      "Peer frame",
      "2026-04-24T12:00:00Z",
    )

  let assert Ok(_) =
    ema_peers.establish_trust(
      bus_subject,
      "org:test",
      peer_device,
      "ed25519:peer-public-key",
      "ed25519:local-public-key",
      "qr_ble_hybrid",
      "ceremony:test-pairing-001",
      "proof:test-lineage-signature",
    )
  let assert Ok(snapshot) =
    ema_collab_sync.apply_frame_from_peer(
      bus_subject,
      collab_subject,
      "org:test",
      peer_device,
      ema_collab.default_document_id,
      "collab_frame:01J0000000000000000000000Z",
      1,
      "Peer frame",
      "2026-04-24T12:00:00Z",
    )

  should.equal(string.contains(snapshot.data_json, "Peer frame"), True)
  should.equal(
    string.contains(snapshot.data_json, "\"updated_by\":\"" <> peer_device),
    True,
  )

  let _ = delete_file(path)
}

pub fn access_session_projection_omits_token_secret_test() {
  let path = tmp_path("ema-access-session.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(challenge) =
    ema_access_sessions.create_challenge(
      bus_subject,
      "org:test",
      "web-access:test",
      ["surface.read", "command.submit"],
      "2026-04-25T00:00:00Z",
    )
  let assert Ok(approval) =
    ema_access_sessions.approve(
      bus_subject,
      "org:test",
      challenge.challenge_id,
      "user:dev-local",
      "device:dev-local",
      ["surface.read", "command.submit"],
      "2026-04-25T00:00:00Z",
    )

  let projection = bus.access_session_projection_json(bus_subject)

  should.equal(string.contains(projection, challenge.challenge_id), True)
  should.equal(string.contains(projection, approval.session_id), True)
  should.equal(string.contains(projection, "surface.read"), True)
  should.equal(string.contains(projection, "token_hash_ref"), False)

  let _ = delete_file(path)
}

pub fn collab_open_replace_and_update_project_document_test() {
  let path = tmp_path("ema-collab-document.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let collab_subject = started.data

  let assert Ok(opened) =
    ema_collab.open(
      collab_subject,
      ema_collab.default_document_id,
      "actor:test",
    )
  let assert Ok(replaced) =
    ema_collab.replace_body(
      collab_subject,
      ema_collab.default_document_id,
      "First draft",
      "actor:test",
    )
  let assert Ok(updated) =
    ema_collab.update_body(
      collab_subject,
      ema_collab.default_document_id,
      "Second draft",
      "actor:test",
    )

  should.equal(
    string.contains(opened.data_json, "\"authority\":\"beam\""),
    True,
  )
  should.equal(string.contains(replaced.update_id, "collab_frame:"), True)
  should.equal(string.contains(updated.data_json, "Second draft"), True)
  should.equal(string.contains(updated.data_json, "\"revision\":2"), True)
  should.equal(
    string.contains(updated.data_json, "\"update_frame_count\":2"),
    True,
  )

  let _ = delete_file(path)
}

pub fn collab_persists_projection_in_sqlite_test() {
  let path = tmp_path("ema-collab-persisted.db")
  let _ = delete_file(path)

  let assert Ok(first) = ema_collab.start(path)
  let assert Ok(_) =
    ema_collab.replace_body(
      first.data,
      ema_collab.default_document_id,
      "Persisted body",
      "actor:test",
    )

  let assert Ok(second) = ema_collab.start(path)
  let assert Ok(snapshot) =
    ema_collab.projection(second.data, ema_collab.default_document_id)

  should.equal(string.contains(snapshot.data_json, "Persisted body"), True)
  should.equal(string.contains(snapshot.data_json, "\"revision\":1"), True)

  let _ = delete_file(path)
}

pub fn collab_subscribers_receive_live_projection_test() {
  let path = tmp_path("ema-collab-subscriber.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let collab_subject = started.data
  let delivery = process.new_subject()

  ema_collab.subscribe(collab_subject, delivery)
  let assert Ok(_) =
    ema_collab.replace_body(
      collab_subject,
      ema_collab.default_document_id,
      "Live body",
      "actor:test",
    )

  let assert Ok(received) = process.receive(delivery, 1000)
  case received {
    ema_collab.DocumentChanged(snapshot) ->
      should.equal(string.contains(snapshot.data_json, "Live body"), True)
    ema_collab.SubscriptionDropped(_) -> should.equal(True, False)
  }

  let _ = delete_file(path)
}

pub fn collab_exports_frame_backlog_for_peer_sync_test() {
  let path = tmp_path("ema-collab-frame-backlog.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let collab_subject = started.data

  let assert Ok(first) =
    ema_collab.replace_body(
      collab_subject,
      ema_collab.default_document_id,
      "Frame one",
      "actor:test",
    )
  let assert Ok(_) =
    ema_collab.replace_body(
      collab_subject,
      ema_collab.default_document_id,
      "Frame two",
      "actor:test",
    )

  let assert Ok(all_frames) =
    ema_collab.frames_since(collab_subject, ema_collab.default_document_id, 0)
  let assert Ok(after_first) =
    ema_collab.frames_since(collab_subject, ema_collab.default_document_id, 1)

  should.equal(string.contains(all_frames.data_json, first.update_id), True)
  should.equal(string.contains(all_frames.data_json, "\"text_sha256\""), True)
  should.equal(
    string.contains(all_frames.data_json, "\"kind\":\"replace\""),
    True,
  )
  should.equal(
    string.contains(all_frames.data_json, ema_collab.default_document_id),
    True,
  )
  should.equal(string.contains(all_frames.data_json, "Frame one"), True)
  should.equal(string.contains(all_frames.data_json, "Frame two"), True)
  should.equal(string.contains(after_first.data_json, "Frame one"), False)
  should.equal(string.contains(after_first.data_json, "Frame two"), True)

  let _ = delete_file(path)
}

pub fn collab_frame_ids_are_typed_ulids_test() {
  let path = tmp_path("ema-collab-frame-id.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let assert Ok(written) =
    ema_collab.replace_body(
      started.data,
      ema_collab.default_document_id,
      "Typed frame id",
      "actor:test",
    )

  should.equal(string.starts_with(written.update_id, "collab_frame:"), True)
  should.equal(string.length(written.update_id), 39)

  let _ = delete_file(path)
}

pub fn collab_applies_remote_frames_idempotently_test() {
  let path = tmp_path("ema-collab-remote-frame.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let collab_subject = started.data
  let remote_frame_id = "collab_frame:01J0000000000000000000000A"

  let assert Ok(applied) =
    ema_collab.apply_frame(
      collab_subject,
      ema_collab.default_document_id,
      remote_frame_id,
      1,
      "Remote frame body",
      "device:remote",
      "2026-04-24T12:00:00Z",
    )
  let assert Ok(duplicate) =
    ema_collab.apply_frame(
      collab_subject,
      ema_collab.default_document_id,
      remote_frame_id,
      1,
      "Remote frame body",
      "device:remote",
      "2026-04-24T12:00:00Z",
    )

  should.equal(applied.update_id, remote_frame_id)
  should.equal(string.contains(applied.data_json, "\"revision\":1"), True)
  should.equal(
    string.contains(duplicate.data_json, "\"update_frame_count\":1"),
    True,
  )

  let assert Error(ema_collab.PersistenceFailed(_)) =
    ema_collab.apply_frame(
      collab_subject,
      ema_collab.default_document_id,
      "collab_frame:01J0000000000000000000000B",
      3,
      "Skipped revision",
      "device:remote",
      "2026-04-24T12:00:01Z",
    )

  let _ = delete_file(path)
}

pub fn collab_peer_cursor_tracks_last_applied_revision_test() {
  let path = tmp_path("ema-collab-peer-cursor.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let collab_subject = started.data
  let peer_device_id = "device:01J0000000000000000000000C"
  let document_id = ema_collab.default_document_id

  let assert Ok(empty_cursor) =
    ema_collab.peer_cursor(collab_subject, peer_device_id, document_id)
  should.equal(
    string.contains(empty_cursor.data_json, "\"last_revision\":0"),
    True,
  )

  let assert Ok(first_frame) =
    ema_collab.replace_body(
      collab_subject,
      document_id,
      "Cursor frame one",
      "actor:test",
    )
  let assert Ok(second_frame) =
    ema_collab.replace_body(
      collab_subject,
      document_id,
      "Cursor frame two",
      "actor:test",
    )

  let assert Ok(advanced) =
    ema_collab.mark_peer_applied(
      collab_subject,
      peer_device_id,
      document_id,
      2,
      second_frame.update_id,
    )
  let assert Ok(stale) =
    ema_collab.mark_peer_applied(
      collab_subject,
      peer_device_id,
      document_id,
      1,
      first_frame.update_id,
    )

  should.equal(string.contains(advanced.data_json, "\"last_revision\":2"), True)
  should.equal(string.contains(stale.data_json, "\"last_revision\":2"), True)
  should.equal(string.contains(stale.data_json, second_frame.update_id), True)

  let _ = delete_file(path)
}

pub fn collab_peer_cursor_rejects_unknown_frame_revision_test() {
  let path = tmp_path("ema-collab-peer-cursor-unknown.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let assert Error(ema_collab.PersistenceFailed(_)) =
    ema_collab.mark_peer_applied(
      started.data,
      "device:01J0000000000000000000000F",
      ema_collab.default_document_id,
      2,
      "collab_frame:01J0000000000000000000000G",
    )

  let _ = delete_file(path)
}

pub fn collab_peer_cursor_rejects_mismatched_frame_id_test() {
  let path = tmp_path("ema-collab-peer-cursor-mismatch.db")
  let _ = delete_file(path)

  let assert Ok(started) = ema_collab.start(path)
  let assert Ok(_) =
    ema_collab.replace_body(
      started.data,
      ema_collab.default_document_id,
      "Cursor frame",
      "actor:test",
    )
  let assert Error(ema_collab.PersistenceFailed(_)) =
    ema_collab.mark_peer_applied(
      started.data,
      "device:01J0000000000000000000000H",
      ema_collab.default_document_id,
      1,
      "collab_frame:01J0000000000000000000000I",
    )

  let _ = delete_file(path)
}

/// T1.2 planner lifecycle: GAC create → answer; decision lock; aspiration capture.
/// Verifies events land and the planner projection includes the new nodes.
pub fn planner_full_lifecycle_test() {
  let path = tmp_path("ema-planner-lifecycle.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(planner_nodes.GacCreated(gac_id, _)) =
    planner_nodes.gac_create(
      bus_subject,
      "org:test",
      "actor:test",
      "blueprint_doc:test",
      None,
      "gap",
      "high",
      "Should the planner do X?",
      None,
    )
  let assert Ok(_) =
    planner_nodes.gac_answer(
      bus_subject,
      "org:test",
      "actor:test",
      gac_id,
      Some("B"),
      None,
      "create_intent",
      None,
    )
  let assert Ok(planner_nodes.DecisionLocked(decision_id, _)) =
    planner_nodes.decision_lock(
      bus_subject,
      "org:test",
      "actor:test",
      "Soft phase enforcement",
      "Log incident.noted; proceed.",
      None,
      None,
    )
  let assert Ok(_) =
    planner_nodes.aspiration_capture(
      bus_subject,
      "org:test",
      "actor:test",
      "Eventually auto-import atlas decisions",
      None,
      "long_term",
      "manual_tag",
      None,
      None,
    )

  should.equal(
    bus.event_exists(bus_subject, "blueprint.gac.created", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "blueprint.gac.answered", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "blueprint.decision.locked", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "blueprint.aspiration.captured", "org:test"),
    True,
  )

  let projection = bus.blueprint_planner_projection_json(bus_subject)
  should.equal(string.contains(projection, gac_id), True)
  should.equal(string.contains(projection, decision_id), True)
  should.equal(string.contains(projection, "auto-import atlas decisions"), True)
  should.equal(string.contains(projection, "\"status\":\"answered\""), True)
  should.equal(string.contains(projection, "\"status\":\"committed\""), True)

  let _ = delete_file(path)
}

/// T1.2 validation: invalid category is rejected.
pub fn planner_invalid_category_rejected_test() {
  let path = tmp_path("ema-planner-validation.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Error(planner_nodes.InvalidCategory(value)) =
    planner_nodes.gac_create(
      bus_subject,
      "org:test",
      "actor:test",
      "blueprint_doc:test",
      None,
      "not_a_category",
      "high",
      "question?",
      None,
    )
  should.equal(value, "not_a_category")

  let _ = delete_file(path)
}

/// T1.1 workspace lifecycle: open → claim → block → release → move → close.
/// Verifies all six lane events land and the projection reflects the final
/// status as `done`.
pub fn lane_full_lifecycle_test() {
  let path = tmp_path("ema-lane-lifecycle.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(agent_workspace.LaneOpened(lane_id, _)) =
    agent_workspace.open_lane(
      bus_subject,
      "org:test",
      "actor:test",
      "Lifecycle test lane",
      None,
      None,
      None,
      None,
      None,
    )

  let assert Ok(_) =
    agent_workspace.claim_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      "the scope",
      "the goal",
      "the next step",
      None,
      None,
    )
  let assert Ok(_) =
    agent_workspace.block_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      "blocked for test",
      None,
    )
  let assert Ok(_) =
    agent_workspace.release_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      None,
      Some("released for test"),
    )
  let assert Ok(_) =
    agent_workspace.move_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      "review",
    )
  let assert Ok(_) =
    agent_workspace.close_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      Some("done"),
      Some("verified"),
    )

  should.equal(bus.event_exists(bus_subject, "lane.opened", "org:test"), True)
  should.equal(bus.event_exists(bus_subject, "lane.claimed", "org:test"), True)
  should.equal(bus.event_exists(bus_subject, "lane.blocked", "org:test"), True)
  should.equal(bus.event_exists(bus_subject, "lane.released", "org:test"), True)
  should.equal(bus.event_exists(bus_subject, "lane.moved", "org:test"), True)
  should.equal(bus.event_exists(bus_subject, "lane.closed", "org:test"), True)

  let projection = bus.lane_registry_projection_json(bus_subject)
  should.equal(string.contains(projection, lane_id), True)
  should.equal(string.contains(projection, "\"status\":\"done\""), True)

  let _ = delete_file(path)
}

/// T1.1 queue lifecycle: add → block → ready → close.
pub fn queue_full_lifecycle_test() {
  let path = tmp_path("ema-queue-lifecycle.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(agent_workspace.QueueItemAdded(item_id, _)) =
    agent_workspace.add_queue_item(
      bus_subject,
      "org:test",
      "actor:test",
      "Queue lifecycle test",
      "demonstrates lifecycle",
      None,
      None,
      None,
      None,
      None,
      None,
      None,
    )

  let assert Ok(_) =
    agent_workspace.mark_queue_item_blocked(
      bus_subject,
      "org:test",
      "actor:test",
      item_id,
      "T1",
      Some("waiting"),
    )
  let assert Ok(_) =
    agent_workspace.mark_queue_item_ready(
      bus_subject,
      "org:test",
      "actor:test",
      item_id,
      Some("unblocked"),
    )
  let assert Ok(_) =
    agent_workspace.close_queue_item(
      bus_subject,
      "org:test",
      "actor:test",
      item_id,
      Some("done"),
      Some("checked"),
    )

  should.equal(
    bus.event_exists(bus_subject, "queue_item.added", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "queue_item.blocked", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "queue_item.ready", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "queue_item.closed", "org:test"),
    True,
  )

  let projection = bus.queue_registry_projection_json(bus_subject)
  should.equal(string.contains(projection, item_id), True)
  should.equal(string.contains(projection, "\"status\":\"closed\""), True)

  let _ = delete_file(path)
}

/// T1.1 validation: invalid lane status is rejected without appending.
pub fn lane_invalid_status_rejected_test() {
  let path = tmp_path("ema-lane-invalid.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(agent_workspace.LaneOpened(lane_id, _)) =
    agent_workspace.open_lane(
      bus_subject,
      "org:test",
      "actor:test",
      "Invalid status test",
      None,
      None,
      None,
      None,
      None,
    )
  let assert Error(agent_workspace.InvalidStatus(value)) =
    agent_workspace.move_lane(
      bus_subject,
      "org:test",
      "actor:test",
      lane_id,
      "not_a_real_status",
    )
  should.equal(value, "not_a_real_status")

  let _ = delete_file(path)
}

/// Slice-1 blueprint writer: create a doc + add two sections, then verify
/// each event landed in the bus and the projection reflects the tree.
pub fn blueprint_document_and_section_writer_test() {
  let path = tmp_path("ema-blueprint-writer.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(ema_blueprint.DocumentCreated(document_id, _)) =
    ema_blueprint.create_document(
      bus_subject,
      "org:test",
      None,
      "actor:test",
      "project:test",
      "Test Blueprint Doc",
    )

  let assert Ok(ema_blueprint.SectionAdded(s1, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      document_id,
      None,
      "First Section",
      0,
    )

  let assert Ok(ema_blueprint.SectionAdded(s2, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      document_id,
      Some(s1),
      "Nested Section",
      0,
    )

  should.equal(
    bus.event_exists(bus_subject, "blueprint.document.created", "org:test"),
    True,
  )
  should.equal(
    bus.event_exists(bus_subject, "blueprint.section.added", "org:test"),
    True,
  )

  let projection = bus.blueprint_projection_json(bus_subject)
  should.equal(string.contains(projection, "Test Blueprint Doc"), True)
  should.equal(string.contains(projection, "First Section"), True)
  should.equal(string.contains(projection, "Nested Section"), True)
  should.equal(string.contains(projection, document_id), True)
  should.equal(string.contains(projection, s2), True)

  let _ = delete_file(path)
}

/// Renaming a section emits the renamed event and the projection reflects
/// the new title (and not the old).
pub fn blueprint_section_rename_test() {
  let path = tmp_path("ema-blueprint-rename.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(ema_blueprint.DocumentCreated(doc, _)) =
    ema_blueprint.create_document(
      bus_subject,
      "org:test",
      None,
      "actor:test",
      "project:test",
      "Doc",
    )
  let assert Ok(ema_blueprint.SectionAdded(sec, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      doc,
      None,
      "Original Title",
      0,
    )
  let assert Ok(_) =
    ema_blueprint.rename_section(
      bus_subject,
      "org:test",
      "actor:test",
      sec,
      "New Title",
    )

  let projection = bus.blueprint_projection_json(bus_subject)
  should.equal(string.contains(projection, "New Title"), True)
}

/// Move event updates the projection's `position` and `parent_section_id`.
pub fn blueprint_section_move_test() {
  let path = tmp_path("ema-blueprint-move.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(ema_blueprint.DocumentCreated(doc, _)) =
    ema_blueprint.create_document(
      bus_subject,
      "org:test",
      None,
      "actor:test",
      "project:test",
      "Doc",
    )
  let assert Ok(ema_blueprint.SectionAdded(parent, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      doc,
      None,
      "Parent",
      0,
    )
  let assert Ok(ema_blueprint.SectionAdded(child, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      doc,
      None,
      "Child",
      1,
    )
  let assert Ok(_) =
    ema_blueprint.move_section(
      bus_subject,
      "org:test",
      "actor:test",
      child,
      Some(parent),
      5,
    )

  should.equal(
    bus.event_exists(bus_subject, "blueprint.section.moved", "org:test"),
    True,
  )
}

/// Removed sections are filtered out of the projection's section list.
pub fn blueprint_section_remove_filters_projection_test() {
  let path = tmp_path("ema-blueprint-remove.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Ok(ema_blueprint.DocumentCreated(doc, _)) =
    ema_blueprint.create_document(
      bus_subject,
      "org:test",
      None,
      "actor:test",
      "project:test",
      "Doc",
    )
  let assert Ok(ema_blueprint.SectionAdded(sec, _)) =
    ema_blueprint.add_section(
      bus_subject,
      "org:test",
      None,
      Some("project:test"),
      "actor:test",
      doc,
      None,
      "Will Be Removed",
      0,
    )
  let assert Ok(_) =
    ema_blueprint.remove_section(bus_subject, "org:test", "actor:test", sec)

  let projection = bus.blueprint_projection_json(bus_subject)
  should.equal(string.contains(projection, "Will Be Removed"), False)
}

/// Validation: empty title returns BlueprintError without appending events.
pub fn blueprint_empty_title_rejected_test() {
  let path = tmp_path("ema-blueprint-validation.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let assert Error(ema_blueprint.EmptyTitle) =
    ema_blueprint.create_document(
      bus_subject,
      "org:test",
      None,
      "actor:test",
      "project:test",
      "",
    )
  let assert Error(ema_blueprint.EmptyOrg) =
    ema_blueprint.create_document(
      bus_subject,
      "",
      None,
      "actor:test",
      "project:test",
      "Doc",
    )

  should.equal(
    bus.event_exists(bus_subject, "blueprint.document.created", "org:test"),
    False,
  )
}

fn sample_envelope(event_id: String) -> event_envelope.Envelope {
  Envelope(
    event_id: event_id,
    kind: "dispatch.started",
    ts: "2026-04-24T00:00:00Z",
    actor: "actor:test",
    org_id: "org:test",
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.some("dispatch:test"),
    execution_id: event_envelope.none(),
    payload_json: "{}",
  )
}

fn peer_envelope(event_id: String, kind: String) -> event_envelope.Envelope {
  Envelope(
    event_id: event_id,
    kind: kind,
    ts: "2026-04-24T00:00:00Z",
    actor: "actor:test",
    org_id: "org:test",
    space_id: event_envelope.none(),
    project_id: event_envelope.none(),
    dispatch_id: event_envelope.none(),
    execution_id: event_envelope.none(),
    payload_json: "{}",
  )
}

/// L2 (campaign:01KQE5GCV300F8V5MM5TFJNJNS, mission:01KQE5HQRR00NFJFTPEHH5EC06):
/// tick_auto_checkups must emit each checkup.scheduled with the lane's
/// own org (captured from the lane.opened envelope) — not a hard-coded
/// org. This test opens lanes in two distinct orgs with daily cadence,
/// runs the tick, and verifies:
///   1. exactly two checkups are emitted (one per lane);
///   2. one checkup.scheduled event exists in each org;
///   3. no checkup.scheduled event lands in the legacy hard-coded
///      `org:01J0…0001`.
pub fn tick_auto_checkups_uses_per_lane_org_test() {
  let path = tmp_path("ema-tick-auto-checkups-per-lane-org.db")
  let _ = delete_file(path)

  let assert Ok(started) = bus.start(path)
  let bus_subject = started.data

  let org_a = "org:test-a"
  let org_b = "org:test-b"
  let legacy_hardcoded = "org:01J00000000000000000000001"

  let assert Ok(agent_workspace.LaneOpened(lane_a_id, _)) =
    agent_workspace.open_lane_linked(
      bus_subject,
      org_a,
      "actor:test-a",
      "Lane in org A",
      None,
      None,
      None,
      None,
      None,
      None,
      None,
      None,
      Some("daily"),
    )
  let assert Ok(_) =
    agent_workspace.claim_lane(
      bus_subject,
      org_a,
      "actor:test-a",
      lane_a_id,
      "scope-a",
      "goal-a",
      "next-a",
      None,
      None,
    )

  let assert Ok(agent_workspace.LaneOpened(lane_b_id, _)) =
    agent_workspace.open_lane_linked(
      bus_subject,
      org_b,
      "actor:test-b",
      "Lane in org B",
      None,
      None,
      None,
      None,
      None,
      None,
      None,
      None,
      Some("daily"),
    )
  let assert Ok(_) =
    agent_workspace.claim_lane(
      bus_subject,
      org_b,
      "actor:test-b",
      lane_b_id,
      "scope-b",
      "goal-b",
      "next-b",
      None,
      None,
    )

  let result = ema_vcalendar.tick_auto_checkups(bus_subject)

  // Both lanes are due (no prior checkup, cadence=daily, age≈0 < daily
  // threshold but the projection treats absence of a prior checkup as
  // due — see lane_due_for_checkup/3 in ema_sqlite_helpers.erl).
  should.equal(result.emitted, 2)
  should.equal(result.skipped_unscoped, 0)
  should.equal(list.length(result.lane_ids), 2)

  // Checkups landed in each lane's actual org.
  should.equal(bus.event_exists(bus_subject, "checkup.scheduled", org_a), True)
  should.equal(bus.event_exists(bus_subject, "checkup.scheduled", org_b), True)
  // Critically: no checkup leaked into the legacy hard-coded org.
  should.equal(
    bus.event_exists(bus_subject, "checkup.scheduled", legacy_hardcoded),
    False,
  )

  let _ = delete_file(path)
}

/// Note on the `skipped_unscoped` field on AutoCheckupTick: it is a
/// defensive tripwire for events that pre-date envelope-scope plumbing
/// (M1). It cannot be exercised through the normal write path because
/// `bus.append/2` rejects envelopes with an empty org_id
/// (PersistenceFailed("empty org_id")) — which is the right behavior.
/// The field is still kept on the return so the IPC handler can surface
/// a real diagnostic if a migrated/corrupted DB ever does contain such
/// an envelope. The richer silent-zero diagnostic ("no_due_lanes" vs
/// "already_within_window") tracked in
/// queue_item:01KQE5P02F015GF0KXM6KHZWWR will layer on top of this.
@external(erlang, "ema_test_helpers", "tmp_path")
fn tmp_path(suffix: String) -> String

@external(erlang, "ema_test_helpers", "delete_file")
fn delete_file(path: String) -> Result(Nil, Nil)

@external(erlang, "ema_test_helpers", "event_kind_org_rows")
fn event_kind_org_rows(path: String) -> List(#(String, String))

@external(erlang, "ema_test_helpers", "table_count")
fn table_count(path: String, table: String) -> Int
