begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

select has_schema('presentation', 'presentation schema exists');
select has_table(
    'presentation',
    'foregrounded_claim',
    'foregrounded_claim selection table exists'
);
select columns_are(
    'presentation',
    'foregrounded_claim',
    array['claim_id'],
    'foregrounded_claim contains only the selected claim identifier'
);
select col_is_pk(
    'presentation',
    'foregrounded_claim',
    'claim_id',
    'claim_id is the foregrounded_claim primary key'
);
select fk_ok(
    'presentation', 'foregrounded_claim', 'claim_id',
    'knowledge', 'claim', 'id',
    'foregrounded_claim references an ordinary knowledge claim'
);
select ok(
    to_regclass('presentation.foregrounded_claim_details') is not null,
    'active foregrounded claim projection exists'
);
select ok(
    to_regnamespace('concepts') is null
        and to_regclass('knowledge.concept') is null
        and to_regclass('entities.concept') is null,
    'foregrounding does not introduce a first-class Concept entity'
);
select ok(
    exists (
        select 1
        from presentation.foregrounded_claim_details
        where claim_id = '50000000-0000-4000-8000-000000000008'::uuid
          and subject_id = '30000000-0000-4000-8000-000000000001'::uuid
          and predicate = 'classified_as'
          and literal_display_value = 'moai'
          and literal_language = 'rap'
    ),
    'the Hoa Hakananaiʻa moai classification is foregrounded as the example'
);

insert into entities.entity (id, entity_type)
values
    ('9a000000-0000-4000-8000-000000000001', 'item'),
    ('9a000000-0000-4000-8000-000000000002', 'agent'),
    ('9a000000-0000-4000-8000-000000000003', 'source');

insert into entities.item (id, item_kind)
values ('9a000000-0000-4000-8000-000000000001', 'artefact');

insert into entities.agent (id, agent_kind)
values ('9a000000-0000-4000-8000-000000000002', 'community');

insert into entities.source (id, source_kind, reference)
values (
    '9a000000-0000-4000-8000-000000000003',
    'interview',
    'foregrounding competency source'
);

insert into knowledge.claim (
    id,
    subject_id,
    predicate,
    literal_value,
    asserted_by_agent_id,
    status
)
values
    (
        '9b000000-0000-4000-8000-000000000001',
        '9a000000-0000-4000-8000-000000000001',
        'classified_as',
        '{"type":"text","value":"ta\u2018oa","language":"rap"}',
        '9a000000-0000-4000-8000-000000000002',
        'active'
    ),
    (
        '9b000000-0000-4000-8000-000000000002',
        '9a000000-0000-4000-8000-000000000001',
        'described_as',
        '{"type":"text","value":"an attributed account","language":"en"}',
        '9a000000-0000-4000-8000-000000000002',
        'active'
    ),
    (
        '9b000000-0000-4000-8000-000000000003',
        '9a000000-0000-4000-8000-000000000001',
        'classified_as',
        '{"type":"text","value":"museum object","language":"en"}',
        null,
        'active'
    ),
    (
        '9b000000-0000-4000-8000-000000000004',
        '9a000000-0000-4000-8000-000000000001',
        'described_as',
        '{"type":"text","value":"withdrawn account","language":"en"}',
        '9a000000-0000-4000-8000-000000000002',
        'withdrawn'
    ),
    (
        '9b000000-0000-4000-8000-000000000005',
        '9a000000-0000-4000-8000-000000000001',
        'described_as',
        '{"type":"text","value":"superseded account","language":"en"}',
        '9a000000-0000-4000-8000-000000000002',
        'superseded'
    );

insert into knowledge.claim_evidence (
    id,
    claim_id,
    source_id,
    relationship,
    locator,
    excerpt
)
values
    (
        '9c000000-0000-4000-8000-000000000001',
        '9b000000-0000-4000-8000-000000000001',
        '9a000000-0000-4000-8000-000000000003',
        'supports',
        'Interview transcript, line 12',
        'ta\u2018oa'
    ),
    (
        '9c000000-0000-4000-8000-000000000002',
        '9b000000-0000-4000-8000-000000000002',
        '9a000000-0000-4000-8000-000000000003',
        'supports',
        'Interview transcript, line 18',
        'an attributed account'
    );

insert into presentation.foregrounded_claim (claim_id)
values
    ('9b000000-0000-4000-8000-000000000001'),
    ('9b000000-0000-4000-8000-000000000002'),
    ('9b000000-0000-4000-8000-000000000004'),
    ('9b000000-0000-4000-8000-000000000005');

select is(
    (
        select count(*)::integer
        from presentation.foregrounded_claim
        where claim_id >= '9b000000-0000-4000-8000-000000000001'
          and claim_id <= '9b000000-0000-4000-8000-000000000005'
    ),
    4,
    'several claims about one item can be selected without a ranking column'
);

select throws_ok(
    $$
    insert into presentation.foregrounded_claim (claim_id)
    values ('9b000000-0000-4000-8000-000000000001')
    $$,
    '23505',
    null,
    'the same claim cannot be selected twice'
);

select results_eq(
    $$
    select claim_id
    from presentation.foregrounded_claim_details
    where subject_id = '9a000000-0000-4000-8000-000000000001'::uuid
    order by claim_id
    $$,
    $$
    values
        ('9b000000-0000-4000-8000-000000000001'::uuid),
        ('9b000000-0000-4000-8000-000000000002'::uuid)
    $$,
    'the presentation projection returns only active selected claims'
);

select ok(
    exists (
        select 1
        from presentation.foregrounded_claim_details as foregrounded
        join knowledge.claim_evidence_details as evidence
            on evidence.claim_id = foregrounded.claim_id
        where foregrounded.claim_id =
                '9b000000-0000-4000-8000-000000000001'::uuid
          and foregrounded.asserted_by_agent_id =
                '9a000000-0000-4000-8000-000000000002'::uuid
          and foregrounded.literal_display_value = 'ta‘oa'
          and evidence.source_id =
                '9a000000-0000-4000-8000-000000000003'::uuid
          and evidence.locator = 'Interview transcript, line 12'
    ),
    'a foregrounded claim retains its wording, attribution and evidence'
);

select ok(
    exists (
        select 1
        from knowledge.claim
        where id = '9b000000-0000-4000-8000-000000000003'::uuid
          and status = 'active'
    )
    and not exists (
        select 1
        from presentation.foregrounded_claim
        where claim_id = '9b000000-0000-4000-8000-000000000003'::uuid
    ),
    'a competing unselected claim remains intact and queryable'
);

select is(
    (
        select count(*)::integer
        from knowledge.claim
        where subject_id = '9a000000-0000-4000-8000-000000000001'::uuid
          and predicate in (
              'care_protocol',
              'access_restriction',
              'owned_by',
              'legal_status',
              'restitution_outcome'
          )
    ),
    0,
    'foregrounding a classification creates no treatment or restitution conclusion'
);

delete from knowledge.claim
where id = '9b000000-0000-4000-8000-000000000002'::uuid;

select is(
    (
        select count(*)::integer
        from presentation.foregrounded_claim
        where claim_id = '9b000000-0000-4000-8000-000000000002'::uuid
    ),
    0,
    'deleting a claim cascades to its foregrounding selection'
);

set local role anon;
select throws_ok(
    $$ select count(*) from presentation.foregrounded_claim $$,
    '42501',
    null,
    'anonymous users cannot read foregrounding selections'
);
reset role;

set local role authenticated;
select throws_ok(
    $$
    insert into presentation.foregrounded_claim (claim_id)
    values ('9b000000-0000-4000-8000-000000000003');
    delete from presentation.foregrounded_claim
    where claim_id = '9b000000-0000-4000-8000-000000000003';
    $$,
    '42501', NULL,
    'authenticated users cannot edit foregrounding selections directly'
);
reset role;

set local role explorer_reader;
select lives_ok(
    $$ select count(*) from presentation.foregrounded_claim_details $$,
    'explorer_reader can read the active foregrounding projection'
);
select throws_ok(
    $$
    insert into presentation.foregrounded_claim (claim_id)
    values ('9b000000-0000-4000-8000-000000000003')
    $$,
    '42501',
    null,
    'explorer_reader cannot edit foregrounding selections'
);
reset role;

select * from finish();

rollback;
